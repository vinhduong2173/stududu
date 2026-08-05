import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  QuestionSource,
  QuestionStatus,
  SetStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiQuestionGeneratorService } from './ai-question-generator.service';
import { FileExtractorService } from './file-extractor.service';
import {
  DryRunResult,
  NormalizedQuestion,
  QuestionValidatorService,
} from './question-validator.service';
import {
  CreateQuestionSetDto,
  ImportQuestionsDto,
  QuestionPayloadDto,
  UpdateQuestionDto,
  UpdateQuestionSetDto,
  VocabTopicDto,
} from './dto/question-set.dto';

/** Số câu bắt buộc để publish — quyết định 28/07, xem question-set-design.md mục 1 */
export const REQUIRED_QUESTION_COUNT = 20;

/** BR-52: 1 lần gọi AI generate / bộ đề / phút */
const GENERATE_COOLDOWN_MS = 60_000;

const CEFR_ORDER: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export function levelOrderOf(level: string): number {
  return CEFR_ORDER[level.toUpperCase()] ?? 1;
}

@Injectable()
export class QuestionSetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: FileExtractorService,
    private readonly generator: AiQuestionGeneratorService,
    private readonly validator: QuestionValidatorService,
  ) {}

  // ===== Chủ đề từ vựng (bảng riêng, không dùng lại Topic — design mục 2) =====

  listVocabTopics(includeHidden = false) {
    return this.prisma.vocabTopic.findMany({
      where: includeHidden ? {} : { hidden: false },
      orderBy: { name: 'asc' },
    });
  }

  async createVocabTopic(dto: VocabTopicDto) {
    const existing = await this.prisma.vocabTopic.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Chủ đề từ vựng này đã tồn tại');
    }
    return this.prisma.vocabTopic.create({
      data: { name: dto.name, hidden: dto.hidden ?? false },
    });
  }

  async updateVocabTopic(id: number, dto: VocabTopicDto) {
    await this.getVocabTopicOrThrow(id);
    return this.prisma.vocabTopic.update({
      where: { id },
      data: { name: dto.name, hidden: dto.hidden },
    });
  }

  private async getVocabTopicOrThrow(id: number) {
    const topic = await this.prisma.vocabTopic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề từ vựng');
    return topic;
  }

  // ===== Bộ đề =====

  async listSets(filter: {
    status?: SetStatus;
    languageId?: number;
    topicId?: number;
    level?: string;
  }) {
    return this.prisma.questionSet.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.languageId ? { languageId: filter.languageId } : {}),
        ...(filter.topicId ? { topicId: filter.topicId } : {}),
        ...(filter.level ? { level: filter.level } : {}),
      },
      include: {
        language: { select: { id: true, code: true, name: true } },
        topic: { select: { id: true, name: true } },
        _count: { select: { questions: { where: { status: 'active' } } } },
      },
      orderBy: [{ levelOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createSet(adminId: number, dto: CreateQuestionSetDto) {
    await this.getVocabTopicOrThrow(dto.topicId);
    const language = await this.prisma.language.findUnique({
      where: { id: dto.languageId },
    });
    if (!language) throw new NotFoundException('Không tìm thấy ngôn ngữ');

    try {
      return await this.prisma.questionSet.create({
        data: {
          languageId: dto.languageId,
          topicId: dto.topicId,
          framework: dto.framework,
          level: dto.level,
          levelOrder: levelOrderOf(dto.level),
          title: dto.title,
          description: dto.description,
          contentLanguage: dto.contentLanguage ?? 'vi',
          createdById: adminId,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Đã có bộ đề cho đúng (ngôn ngữ × chủ đề × trình độ) này. ' +
            'Mỗi tổ hợp chỉ được một bộ đề.',
        );
      }
      throw err;
    }
  }

  async getSet(id: number) {
    const set = await this.prisma.questionSet.findUnique({
      where: { id },
      include: {
        language: { select: { id: true, code: true, name: true } },
        topic: { select: { id: true, name: true } },
        questions: {
          where: { status: QuestionStatus.active },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề');
    return set;
  }

  async updateSet(adminId: number, id: number, dto: UpdateQuestionSetDto) {
    await this.getSet(id);
    return this.prisma.questionSet.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.level ? { levelOrder: levelOrderOf(dto.level) } : {}),
        updatedById: adminId,
      },
    });
  }

  // ===== Sinh câu hỏi bằng AI (chỉ dry-run, KHÔNG tự lưu — BR-48) =====

  async generateFromFile(
    setId: number,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    options: { questionCount?: number; note?: string },
  ): Promise<
    DryRunResult & { sourceMeta: Record<string, unknown>; truncated: boolean }
  > {
    const set = await this.getSet(setId);

    // BR-52 — chặn bấm nhầm liên tiếp; không giới hạn số lần/ngày ở giai đoạn này
    if (
      set.lastGeneratedAt &&
      Date.now() - set.lastGeneratedAt.getTime() < GENERATE_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (GENERATE_COOLDOWN_MS - (Date.now() - set.lastGeneratedAt.getTime())) /
          1000,
      );
      throw new BadRequestException(
        `Bộ đề này vừa gọi AI sinh câu hỏi. Vui lòng thử lại sau ${waitSec} giây.`,
      );
    }

    const extracted = await this.extractor.extract(file.buffer, file.mimetype);
    console.log(extracted.text);
    const generated = await this.generator.generate(
      {
        targetLanguage: set.language.name,
        framework: set.framework,
        level: set.level,
        questionCount: options.questionCount ?? REQUIRED_QUESTION_COUNT,
        extractedText: extracted.text,
        note: options.note,
      },
      { fileName: file.originalname, fileType: file.mimetype },
    );

    await this.prisma.questionSet.update({
      where: { id: setId },
      data: { lastGeneratedAt: new Date() },
    });

    const existingPrompts = set.questions.map((q) => q.prompt);
    const dryRun = this.validator.dryRun(generated.questions, existingPrompts);

    return {
      ...dryRun,
      sourceMeta: {
        ...generated.sourceMeta,
        extractedCharCount: extracted.charCount,
      },
      truncated: extracted.truncated,
    };
  }

  // ===== Thêm câu hỏi (dùng chung AI + nhập tay — BR-55) =====

  /** Thêm 1 câu thủ công (form cứu hộ, mục 5 của question-set-ai-only-flow.md) */
  async addManualQuestion(
    adminId: number,
    setId: number,
    dto: QuestionPayloadDto,
  ) {
    const set = await this.getSet(setId);
    const { question, errors } = this.validator.validateOne(
      dto,
      set.questions.map((q) => q.prompt),
    );
    if (!question) {
      throw new BadRequestException(errors);
    }
    return this.persistQuestions(
      adminId,
      setId,
      [question],
      QuestionSource.manual,
    );
  }

  /** Nhập các câu đã đạt sau bước xem trước */
  async importQuestions(
    adminId: number,
    setId: number,
    dto: ImportQuestionsDto,
  ) {
    const set = await this.getSet(setId);
    const dryRun = this.validator.dryRun(
      dto.questions,
      set.questions.map((q) => q.prompt),
    );
    if (dryRun.errorCount > 0) {
      throw new BadRequestException({
        message: `${dryRun.errorCount}/${dryRun.total} câu chưa hợp lệ, chưa nhập câu nào.`,
        rows: dryRun.rows.filter((r) => !r.valid),
      });
    }

    const accepted = dryRun.rows
      .map((r) => r.question)
      .filter((q): q is NormalizedQuestion => q !== null);

    return this.persistQuestions(
      adminId,
      setId,
      accepted,
      // BR-53: câu AI sinh dù Admin có sửa tay vẫn giữ source = ai_generated
      dto.aiGenerated ? QuestionSource.ai_generated : QuestionSource.manual,
      dto.aiGenerated ? dto.sourceMeta : undefined,
    );
  }

  private async persistQuestions(
    adminId: number,
    setId: number,
    questions: NormalizedQuestion[],
    source: QuestionSource,
    sourceMeta?: Record<string, unknown>,
  ) {
    const maxOrder = await this.prisma.testQuestion.aggregate({
      where: { setId },
      _max: { orderIndex: true },
    });
    let order = (maxOrder._max.orderIndex ?? -1) + 1;

    await this.prisma.testQuestion.createMany({
      data: questions.map((q) => ({
        setId,
        orderIndex: order++,
        type: q.type,
        term: q.term,
        passage: q.passage,
        prompt: q.prompt,
        options: q.options,
        answerIndex: q.answerIndex,
        explanation: q.explanation,
        source,
        // BR-49/BR-57: chỉ lưu sourceMeta cho câu AI sinh
        sourceMeta:
          source === QuestionSource.ai_generated && sourceMeta
            ? (sourceMeta as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      })),
    });

    await this.syncQuestionCount(setId, adminId);
    return this.getSet(setId);
  }

  async updateQuestion(
    adminId: number,
    questionId: number,
    dto: UpdateQuestionDto,
  ) {
    const question = await this.prisma.testQuestion.findUnique({
      where: { id: questionId },
      include: { set: true, _count: { select: { answers: true } } },
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    // Sửa bộ đã publish: không cho đổi đáp án đúng của câu ĐÃ CÓ NGƯỜI TRẢ LỜI —
    // điểm đã chấm sẽ trở nên vô nghĩa (design mục 5)
    const changesAnswer =
      (dto.answerIndex !== undefined &&
        dto.answerIndex !== question.answerIndex) ||
      dto.options !== undefined;
    if (changesAnswer && question._count.answers > 0) {
      throw new BadRequestException(
        'Câu này đã có người trả lời nên không được sửa đáp án đúng. ' +
          'Hãy chuyển câu cũ sang "retired" rồi thêm câu mới thay thế.',
      );
    }

    const merged = {
      type: dto.type ?? question.type,
      term: dto.term ?? question.term,
      passage: dto.passage ?? question.passage,
      prompt: dto.prompt ?? question.prompt,
      options: dto.options ?? question.options,
      answerIndex: dto.answerIndex ?? question.answerIndex,
      explanation: dto.explanation ?? question.explanation,
    };

    const siblings = await this.prisma.testQuestion.findMany({
      where: {
        setId: question.setId,
        status: QuestionStatus.active,
        id: { not: questionId },
      },
      select: { prompt: true },
    });
    const { question: normalized, errors } = this.validator.validateOne(
      merged,
      siblings.map((s) => s.prompt),
    );
    if (!normalized) throw new BadRequestException(errors);

    const updated = await this.prisma.testQuestion.update({
      where: { id: questionId },
      // BR-53: KHÔNG đổi `source` khi Admin hiệu đính câu AI sinh
      data: {
        type: normalized.type,
        term: normalized.term,
        passage: normalized.passage,
        prompt: normalized.prompt,
        options: normalized.options,
        answerIndex: normalized.answerIndex,
        explanation: normalized.explanation,
      },
    });
    await this.syncQuestionCount(question.setId, adminId);
    return updated;
  }

  /** Xoá câu: đã có người trả lời thì chỉ retire, không xoá cứng (design mục 5) */
  async removeQuestion(adminId: number, questionId: number) {
    const question = await this.prisma.testQuestion.findUnique({
      where: { id: questionId },
      include: { _count: { select: { answers: true } } },
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    if (question._count.answers > 0) {
      await this.prisma.testQuestion.update({
        where: { id: questionId },
        data: { status: QuestionStatus.retired },
      });
    } else {
      await this.prisma.testQuestion.delete({ where: { id: questionId } });
    }
    await this.syncQuestionCount(question.setId, adminId);
    return { message: 'Đã xoá câu hỏi khỏi bộ đề' };
  }

  private async syncQuestionCount(setId: number, adminId: number) {
    const count = await this.prisma.testQuestion.count({
      where: { setId, status: QuestionStatus.active },
    });
    await this.prisma.questionSet.update({
      where: { id: setId },
      data: { questionCount: count, updatedById: adminId },
    });
  }

  // ===== Cửa publish — hai điều kiện (design mục 4) =====

  /** Tính lại khi đọc, không cache — cùng tinh thần BR-05/BR-14 */
  async getPublishGate(setId: number) {
    const activeCount = await this.prisma.testQuestion.count({
      where: { setId, status: QuestionStatus.active },
    });
    const adminTrial = await this.prisma.testAttempt.findFirst({
      where: {
        setId,
        finishedAt: { not: null },
        user: { role: UserRole.admin },
      },
      orderBy: { finishedAt: 'desc' },
      select: {
        id: true,
        correctCount: true,
        totalCount: true,
        finishedAt: true,
      },
    });

    return {
      requiredCount: REQUIRED_QUESTION_COUNT,
      activeCount,
      hasEnoughQuestions: activeCount === REQUIRED_QUESTION_COUNT,
      hasAdminTrial: adminTrial !== null,
      adminTrial,
      canPublish:
        activeCount === REQUIRED_QUESTION_COUNT && adminTrial !== null,
    };
  }

  async publish(adminId: number, setId: number) {
    await this.getSet(setId);
    const gate = await this.getPublishGate(setId);
    if (!gate.hasEnoughQuestions) {
      throw new BadRequestException(
        `Bộ đề cần đúng ${REQUIRED_QUESTION_COUNT} câu đang dùng (hiện có ${gate.activeCount}).`,
      );
    }
    if (!gate.hasAdminTrial) {
      throw new BadRequestException(
        'Bạn phải làm thử trọn bộ đề ít nhất một lần trước khi publish.',
      );
    }
    return this.prisma.questionSet.update({
      where: { id: setId },
      data: {
        status: SetStatus.published,
        publishedAt: new Date(),
        updatedById: adminId,
      },
    });
  }

  async unpublish(adminId: number, setId: number) {
    await this.getSet(setId);
    return this.prisma.questionSet.update({
      where: { id: setId },
      data: { status: SetStatus.draft, updatedById: adminId },
    });
  }
}
