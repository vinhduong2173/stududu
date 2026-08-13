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
    const { startsAt, endsAt, ...restDto } = dto;
    try {
      return await this.prisma.questionSet.update({
        where: { id },
        data: {
          ...restDto,
          ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
          ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
          ...(dto.level ? { levelOrder: levelOrderOf(dto.level) } : {}),
          updatedById: adminId,
        },
      });
    } catch (err) {
      // Đổi `level` có thể đụng @@unique([languageId, topicId, level]) — không bắt
      // ở đây thì lỗi Prisma thô lọt ra thành 500 khó hiểu
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Đã có bộ đề khác cho đúng (ngôn ngữ × chủ đề × trình độ) này. ' +
            'Mỗi tổ hợp chỉ được một bộ đề.',
        );
      }
      throw err;
    }
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

    // Đặt mốc TRƯỚC khi gọi AI: BR-52 chặn bấm nhầm liên tiếp, mà lần bấm thứ hai
    // thường rơi vào lúc lần đầu còn đang chạy. Đặt sau khi gọi xong thì hai
    // request song song cùng lọt qua cửa. Lỗi đọc file xảy ra trước dòng này nên
    // không bị "phạt" 60 giây oan.
    await this.prisma.questionSet.update({
      where: { id: setId },
      data: { lastGeneratedAt: new Date() },
    });

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
    // Cửa publish đòi ĐÚNG 20 câu (design mục 4). Không chặn ở đây thì Admin nhập
    // dư sẽ kẹt vĩnh viễn: bộ 25 câu không bao giờ publish được, mà khung "còn N
    // chỗ" ở FE đã biến mất nên cũng không thấy đường sửa.
    await this.assertRoomFor(setId, questions.length);

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

  /** Còn đủ chỗ cho `incoming` câu nữa không — trần là REQUIRED_QUESTION_COUNT */
  private async assertRoomFor(setId: number, incoming: number) {
    const activeCount = await this.prisma.testQuestion.count({
      where: { setId, status: QuestionStatus.active },
    });
    if (activeCount + incoming > REQUIRED_QUESTION_COUNT) {
      throw new BadRequestException(
        `Bộ đề đã đủ ${REQUIRED_QUESTION_COUNT} câu, không thể thêm ${incoming} câu mới.`,
      );
    }
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

  /** Số lượt làm thử gần nhất đọc lên để tìm lượt còn hiệu lực — đủ cho quy mô MVP */
  private static readonly TRIAL_SCAN_LIMIT = 20;

  /** Tính lại khi đọc, không cache — cùng tinh thần BR-05/BR-14 */
  async getPublishGate(setId: number) {
    const activeQuestions = await this.prisma.testQuestion.findMany({
      where: { setId, status: QuestionStatus.active },
      select: { id: true },
    });
    const activeCount = activeQuestions.length;

    // Lượt làm thử chỉ có giá trị nếu Admin đã đi qua ĐÚNG bộ câu đang dùng.
    // Không kiểm điều này thì một lượt làm hồi bộ mới có 3 câu vẫn mở cửa publish,
    // và 17 câu thêm sau đó lên sóng mà chưa ai đọc — đúng thứ điều kiện 2 sinh ra
    // để chặn (design mục 4).
    const trials = await this.prisma.testAttempt.findMany({
      where: {
        setId,
        finishedAt: { not: null },
        user: { role: UserRole.admin },
      },
      orderBy: { finishedAt: 'desc' },
      take: QuestionSetsService.TRIAL_SCAN_LIMIT,
      select: {
        id: true,
        correctCount: true,
        totalCount: true,
        finishedAt: true,
        questionOrder: true,
      },
    });

    const covering =
      activeCount > 0
        ? trials.find((trial) => {
            const seen = new Set(trial.questionOrder);
            return activeQuestions.every((q) => seen.has(q.id));
          })
        : undefined;

    const adminTrial = covering
      ? {
          id: covering.id,
          correctCount: covering.correctCount,
          totalCount: covering.totalCount,
          finishedAt: covering.finishedAt,
        }
      : null;

    // Có làm thử nhưng từ đó bộ đề đã đổi câu → phải làm lại, nói rõ để Admin
    // không tưởng nút "Làm thử" bị hỏng
    const trialOutdated = adminTrial === null && trials.length > 0;

    const hasEnoughQuestions = activeCount === REQUIRED_QUESTION_COUNT;
    const hasAdminTrial = adminTrial !== null;
    const canPublish = hasEnoughQuestions && hasAdminTrial;

    return {
      requiredCount: REQUIRED_QUESTION_COUNT,
      activeCount,
      hasEnoughQuestions,
      hasAdminTrial,
      trialOutdated,
      adminTrial,
      canPublish,
    };
  }

  async publish(adminId: number, setId: number) {
    const gate = await this.getPublishGate(setId);
    if (!gate.hasEnoughQuestions) {
      throw new BadRequestException(
        `Bộ đề chưa đủ câu (hiện có ${gate.activeCount}/${REQUIRED_QUESTION_COUNT} câu). Cần đúng ${REQUIRED_QUESTION_COUNT} câu mới xuất bản được.`,
      );
    }
    if (gate.trialOutdated) {
      throw new BadRequestException(
        'Nội dung bộ đề đã đổi câu hỏi kể từ lần làm thử cuối. Vui lòng làm thử lại trước khi xuất bản.',
      );
    }
    if (!gate.hasAdminTrial) {
      throw new BadRequestException(
        'Admin phải làm thử bộ đề (đạt ít nhất 1 lần) mới được xuất bản.',
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

    // Gỡ phát hành giữa lúc thử thách đang chạy = người học bấm "Tham gia" rồi ăn
    // lỗi "bộ đề chưa được phát hành", còn bảng xếp hạng thì dở dang. Chặn ở đây,
    // Admin muốn dừng thì xoá thử thách trước.
    const now = new Date();
    const running = await this.prisma.communityChallenge.findFirst({
      where: { setId, startsAt: { lte: now }, endsAt: { gte: now } },
      select: { title: true },
    });
    if (running) {
      throw new ConflictException(
        `Thử thách "${running.title}" đang dùng bộ đề này và chưa kết thúc. ` +
          'Hãy xoá hoặc chờ thử thách kết thúc rồi mới gỡ phát hành.',
      );
    }

    return this.prisma.questionSet.update({
      where: { id: setId },
      data: { status: SetStatus.draft, updatedById: adminId },
    });
  }

  async deleteSet(setId: number) {
    await this.getSet(setId);
    await this.prisma.testAnswer.deleteMany({
      where: { attempt: { setId } },
    });
    await this.prisma.testAttempt.deleteMany({ where: { setId } });
    await this.prisma.testQuestion.deleteMany({ where: { setId } });
    await this.prisma.communityChallenge.deleteMany({ where: { setId } });
    await this.prisma.questionSet.delete({ where: { id: setId } });
    return { message: "Đã xoá bộ đề thành công" };
  }
}
