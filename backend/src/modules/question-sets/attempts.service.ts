// Updated Prisma Client types
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  QuestionSet,
  QuestionStatus,
  SetStatus,
  TestAttempt,
  TestQuestion,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAttemptDto } from './dto/question-set.dto';

/** Hạn mức làm bài — quyết định 28/07 (question-set-design.md mục 1) */
export const DAILY_SET_LIMIT = 3;

/** Ngưỡng gợi ý lên/lùi bậc (design mục 7) — chỉ gợi ý, không tự đổi trình độ */
const LEVEL_UP_RATIO = 0.8;
const LEVEL_DOWN_RATIO = 0.5;

/** Offset UTC theo mã múi giờ — khớp frontend/src/lib/timezones.ts */
const TZ_OFFSETS: Record<string, number> = {
  VN: 7,
  UK: 0,
  JP: 9,
  KR: 9,
  US_ET: -5,
  AU: 10,
  SG: 8,
  FR: 1,
};

/** Mốc 00:00 hôm nay theo múi giờ người học, quy về UTC */
function startOfLocalDay(timezone: string | null | undefined): Date {
  const offsetHours = TZ_OFFSETS[timezone ?? 'VN'] ?? 7;
  const nowLocalMs = Date.now() + offsetHours * 3_600_000;
  const local = new Date(nowLocalMs);
  const midnightLocalMs = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  return new Date(midnightLocalMs - offsetHours * 3_600_000);
}

/** Fisher–Yates — đảo thứ tự câu và đáp án mỗi lần làm (design mục 7) */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Hoán vị đáp án: mảng ánh xạ [vị trí hiển thị] -> index gốc */
type OptionOrderMap = Record<string, number[]>;

/** Phần của lượt làm bài đủ để dựng lại đề đúng như lúc bắt đầu */
type AttemptRow = Pick<
  TestAttempt,
  'id' | 'startedAt' | 'questionOrder' | 'optionOrder'
>;

/** Phần của bộ đề cần để hiển thị đề — không kèm `answerIndex` */
type AttemptSet = Pick<
  QuestionSet,
  'id' | 'title' | 'framework' | 'level' | 'timePerQuestionSec'
> & {
  language: { id: number; code: string; name: string };
  topic: { id: number; name: string };
  questions: Pick<
    TestQuestion,
    'id' | 'type' | 'term' | 'passage' | 'prompt' | 'options' | 'answerIndex'
  >[];
};

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sách bộ đề cho người học — chỉ thấy bộ `published` (design mục 4) */
  async listPublishedSets(
    userId: number,
    filter: { languageId?: number; topicId?: number; level?: string },
  ) {
    const sets = await this.prisma.questionSet.findMany({
      where: {
        OR: [
          { status: SetStatus.published },
          { questions: { some: { status: 'active' } } },
        ],
        ...(filter.languageId ? { languageId: filter.languageId } : {}),
        ...(filter.topicId ? { topicId: filter.topicId } : {}),
        ...(filter.level ? { level: filter.level } : {}),
        topic: { hidden: false },
      },
      include: {
        language: { select: { id: true, code: true, name: true } },
        topic: { select: { id: true, name: true } },
        _count: {
          select: {
            questions: { where: { status: 'active' } },
          },
        },
        attempts: {
          where: { userId, finishedAt: { not: null } },
          orderBy: { finishedAt: 'desc' },
          take: 1,
          select: { correctCount: true, totalCount: true, finishedAt: true, startedAt: true, score: true },
        },
      },
      orderBy: [{ levelOrder: 'asc' }, { title: 'asc' }],
    });

    const setIds = sets.map((s) => s.id);

    // Tính takerCount (số user duy nhất đã từng nộp bài test này)
    const takerCountsRaw = await this.prisma.testAttempt.groupBy({
      by: ['setId', 'userId'],
      where: { setId: { in: setIds }, finishedAt: { not: null } },
    });

    const takerCountMap: Record<number, number> = {};
    for (const row of takerCountsRaw) {
      takerCountMap[row.setId] = (takerCountMap[row.setId] || 0) + 1;
    }

    // Tính số lần user đã hoàn thành cho mỗi set
    const userAttemptsRaw = await this.prisma.testAttempt.groupBy({
      by: ['setId'],
      where: { userId, setId: { in: setIds }, finishedAt: { not: null } },
      _count: { id: true },
    });

    const userAttemptsMap: Record<number, number> = {};
    for (const row of userAttemptsRaw) {
      userAttemptsMap[row.setId] = row._count.id;
    }

    const now = new Date();

    return sets.map(({ attempts, _count, ...set }) => {
      const lastAttempt = attempts[0] ?? null;
      const takerCount = takerCountMap[set.id] || 0;
      const userAttemptsCount = userAttemptsMap[set.id] || 0;

      let isExpired = false;
      let isNotStarted = false;
      let diffDays: number | null = null;
      let expiryText = 'Không giới hạn';

      if (set.startsAt && new Date(set.startsAt) > now) {
        isNotStarted = true;
        expiryText = 'Sắp mở';
      } else if (set.endsAt) {
        const endsDate = new Date(set.endsAt);
        if (endsDate < now) {
          isExpired = true;
          expiryText = 'Đã kết thúc';
        } else {
          diffDays = Math.ceil((endsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expiryText = diffDays > 0 ? `Còn ${diffDays} ngày` : 'Hết hạn hôm nay';
        }
      }

      const isLimitReached =
        Boolean(set.maxAttempts && set.maxAttempts > 0 && userAttemptsCount >= set.maxAttempts);

      const questionCount = _count?.questions ?? set.questionCount ?? 20;
      const timePerQuestionSec = set.timePerQuestionSec || 15;
      const timePerQuestion = `${timePerQuestionSec}s/câu`;

      const score = lastAttempt
        ? (lastAttempt.score && lastAttempt.score > 0
            ? lastAttempt.score
            : lastAttempt.totalCount > 0
              ? Math.round((lastAttempt.correctCount / lastAttempt.totalCount) * 1000)
              : 0)
        : undefined;

      return {
        ...set,
        questionCount,
        timePerQuestionSec,
        timePerQuestion,
        takerCount,
        userAttemptsCount,
        isExpired,
        isNotStarted,
        isLimitReached,
        diffDays,
        expiryText,
        score,
        lastAttempt,
      };
    });
  }

  /** Hạn mức còn lại hôm nay — tính lại khi đọc, không cache */
  async getDailyQuota(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, role: true },
    });
    const since = startOfLocalDay(user?.timezone);
    const rows = await this.prisma.testAttempt.findMany({
      // Lượt trong thử thách KHÔNG tính vào hạn mức: `start` đã cho nó đi vòng qua
      // cửa hạn mức rồi, đếm ở đây nữa thì tham gia thử thách lại âm thầm ăn mất
      // một suất luyện tập của chính người đó.
      where: { userId, challengeId: null, startedAt: { gte: since } },
      select: { setId: true },
      distinct: ['setId'],
    });
    const used = rows.length;
    return {
      limit: DAILY_SET_LIMIT,
      used,
      remaining: Math.max(0, DAILY_SET_LIMIT - used),
      resetsAt: new Date(since.getTime() + 24 * 3_600_000),
      // Admin làm thử để mở cửa publish nên không bị hạn mức chặn
      exempt: user?.role === UserRole.admin,
    };
  }

  /**
   * Bắt đầu một lượt làm bài. Trả về câu hỏi ĐÃ đảo thứ tự và KHÔNG kèm đáp án đúng.
   * @param challengeId khác null = làm trong khuôn khổ thử thách community
   */
  async start(userId: number, setId: number, challengeId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, timezone: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    const isAdmin = user.role === UserRole.admin;

    const set = await this.prisma.questionSet.findUnique({
      where: { id: setId },
      include: {
        questions: { where: { status: QuestionStatus.active } },
        language: { select: { id: true, code: true, name: true } },
        topic: { select: { id: true, name: true } },
      },
    });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề');
    if (set.status !== SetStatus.published && !isAdmin) {
      throw new ForbiddenException('Bộ đề này chưa được phát hành');
    }
    if (set.questions.length === 0) {
      throw new BadRequestException('Bộ đề chưa có câu hỏi nào');
    }

    if (challengeId !== undefined) {
      const resumable = await this.assertChallengeOpen(
        challengeId,
        setId,
        userId,
      );
      // Đóng tab giữa chừng rồi quay lại: trả đúng lượt cũ thay vì tạo lượt mới
      // (`@@unique([userId, challengeId])` chặn lượt thứ hai) — nếu không, người
      // học kẹt vĩnh viễn ở màn "chỉ được làm một lần" mà chưa hề nộp bài.
      if (resumable) {
        return this.buildAttemptView(resumable, set);
      }
    } else if (!isAdmin) {
      const quota = await this.getDailyQuota(userId);
      // Lượt dở dang của cùng bộ đề thì không tính thêm — cho phép làm tiếp
      const alreadyStartedToday = await this.prisma.testAttempt.findFirst({
        where: {
          userId,
          setId,
          challengeId: null,
          startedAt: { gte: startOfLocalDay(user.timezone) },
        },
      });
      if (quota.remaining === 0 && !alreadyStartedToday) {
        throw new ForbiddenException(
          `Bạn đã làm đủ ${DAILY_SET_LIMIT} bộ đề hôm nay. Hạn mức làm mới sau 00:00 theo múi giờ của bạn.`,
        );
      }
    }

    const order = shuffled(set.questions.map((q) => q.id));
    const optionOrder: OptionOrderMap = {};
    for (const q of set.questions) {
      optionOrder[String(q.id)] = shuffled(q.options.map((_, i) => i));
    }

    const attempt = await this.prisma.testAttempt.create({
      data: {
        userId,
        setId,
        challengeId: challengeId ?? null,
        totalCount: set.questions.length,
        questionOrder: order,
        optionOrder: optionOrder,
      },
    });

    return this.buildAttemptView(attempt, set);
  }

  /**
   * Dựng đề để trả cho client — dùng chung cho lượt mới và lượt mở lại, nên thứ tự
   * câu/đáp án luôn lấy từ bản đã lưu, không bốc lại.
   */
  private buildAttemptView(attempt: AttemptRow, set: AttemptSet) {
    const optionOrder = (attempt.optionOrder ?? {}) as OptionOrderMap;
    const byId = new Map(set.questions.map((q) => [q.id, q]));

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      set: {
        id: set.id,
        title: set.title,
        framework: set.framework,
        level: set.level,
        language: set.language,
        topic: set.topic,
        timePerQuestionSec: set.timePerQuestionSec || 15,
      },
      questions: attempt.questionOrder
        // Câu bị retire sau khi lượt này bắt đầu thì bỏ khỏi đề — `submit` cũng bỏ
        // qua đúng những câu đó nên hai bên khớp nhau
        .filter((qid) => byId.has(qid) && optionOrder[String(qid)])
        .map((qid, position) => {
          const q = byId.get(qid)!;
          const perm = optionOrder[String(qid)];
          const displayAnswerIndex = perm ? perm.indexOf(q.answerIndex) : 0;
          return {
            id: q.id,
            position,
            type: q.type,
            term: q.term,
            passage: q.passage,
            prompt: q.prompt,
            // Đáp án đã đảo — chỉ số gửi lên khi nộp là chỉ số HIỂN THỊ
            options: perm.map((original) => q.options[original]),
            answerIndex: displayAnswerIndex >= 0 ? displayAnswerIndex : 0,
          };
        }),
    };
  }

  /** Nộp bài: map chỉ số hiển thị về chỉ số gốc rồi chấm */
  async submit(userId: number, attemptId: number, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        set: {
          include: {
            questions: { where: { status: QuestionStatus.active } },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');
    if (attempt.userId !== userId) {
      throw new ForbiddenException('Đây không phải lượt làm bài của bạn');
    }
    if (attempt.finishedAt) {
      throw new BadRequestException('Lượt làm bài này đã nộp rồi');
    }

    const optionOrder = (attempt.optionOrder ?? {}) as OptionOrderMap;
    const byId = new Map(attempt.set.questions.map((q) => [q.id, q]));
    const chosenByQuestion = new Map(
      dto.answers.map((a) => [a.questionId, a.chosenIndex]),
    );

    let correctCount = 0;
    const answerRows: Prisma.TestAnswerCreateManyInput[] = [];
    const review: {
      questionId: number;
      chosenIndex: number | null;
      answerIndex: number;
      isCorrect: boolean;
      explanation: string | null;
      term: string | null;
      options: string[];
    }[] = [];

    for (const questionId of attempt.questionOrder) {
      const question = byId.get(questionId);
      if (!question) continue; // câu bị retire giữa chừng — bỏ qua, không tính điểm

      const displayed = chosenByQuestion.get(questionId);
      const perm = optionOrder[String(questionId)];
      const originalIndex =
        displayed === null || displayed === undefined || !perm
          ? null
          : (perm[displayed] ?? null);

      const isCorrect = originalIndex === question.answerIndex;
      if (isCorrect) correctCount++;

      answerRows.push({
        attemptId,
        questionId,
        chosenIndex: originalIndex,
        isCorrect,
      });
      review.push({
        questionId,
        chosenIndex: originalIndex,
        answerIndex: question.answerIndex,
        isCorrect,
        explanation: question.explanation,
        term: question.term,
        options: question.options,
      });
    }

    const finishedAt = new Date();
    const durationSec = Math.round(
      (finishedAt.getTime() - attempt.startedAt.getTime()) / 1000,
    );
    const timePerQuestionSec = attempt.set.timePerQuestionSec || 15;
    const totalPossibleTime = answerRows.length * timePerQuestionSec;
    const timeSavedRatio =
      totalPossibleTime > 0
        ? Math.max(0, (totalPossibleTime - durationSec) / totalPossibleTime)
        : 0;
    const speedBonusTotal = Math.round(correctCount * 500 * timeSavedRatio);
    const calculatedScore = correctCount * 1000 + speedBonusTotal;
    const finalScore = dto.score && dto.score > 0 ? dto.score : calculatedScore;

    await this.prisma.$transaction([
      this.prisma.testAnswer.createMany({
        data: answerRows,
        skipDuplicates: true,
      }),
      this.prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          correctCount,
          finishedAt,
          totalCount: answerRows.length,
          score: finalScore,
        },
      }),
    ]);

    const ratio = answerRows.length > 0 ? correctCount / answerRows.length : 0;
    return {
      attemptId,
      correctCount,
      totalCount: answerRows.length,
      score: finalScore,
      durationSec,
      // Chỉ gợi ý, không tự đổi trình độ của người học
      levelHint:
        ratio >= LEVEL_UP_RATIO
          ? 'up'
          : ratio < LEVEL_DOWN_RATIO
            ? 'down'
            : 'stay',
      review,
    };
  }

  /** Lịch sử — lưu TẤT CẢ các lượt (quyết định 28/07), không chỉ lượt cao nhất */
  async history(userId: number, setId?: number) {
    return this.prisma.testAttempt.findMany({
      where: { userId, finishedAt: { not: null }, ...(setId ? { setId } : {}) },
      include: {
        set: {
          select: {
            id: true,
            title: true,
            level: true,
            framework: true,
            topic: { select: { id: true, name: true } },
          },
        },
        challenge: { select: { id: true, title: true } },
      },
      orderBy: { finishedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * @returns lượt còn dở của người này trong thử thách (để làm tiếp), `null` nếu
   *   chưa từng vào. Đã NỘP rồi thì ném lỗi — mỗi người một lượt (design mục 7b).
   */
  private async assertChallengeOpen(
    challengeId: number,
    setId: number,
    userId: number,
  ): Promise<AttemptRow | null> {
    const challenge = await this.prisma.communityChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Không tìm thấy thử thách');
    if (challenge.setId !== setId) {
      throw new BadRequestException('Thử thách này dùng bộ đề khác');
    }
    const now = new Date();
    if (now < challenge.startsAt) {
      throw new BadRequestException('Thử thách chưa bắt đầu');
    }
    if (now > challenge.endsAt) {
      throw new BadRequestException('Thử thách đã kết thúc');
    }

    const existing = await this.prisma.testAttempt.findFirst({
      where: { userId, challengeId },
      select: {
        id: true,
        startedAt: true,
        questionOrder: true,
        optionOrder: true,
        finishedAt: true,
      },
    });
    if (existing?.finishedAt) {
      throw new BadRequestException(
        'Mỗi người chỉ được làm thử thách này một lần — kết quả đã được ghi nhận.',
      );
    }
    return existing ?? null;
  }

  /** Bảng xếp hạng Top 10 thí sinh làm bài tốt nhất cho 1 bộ đề */
  async getLeaderboard(setId: number) {
    const attempts = await this.prisma.testAttempt.findMany({
      where: { setId, finishedAt: { not: null } },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: [{ correctCount: 'desc' }, { finishedAt: 'asc' }],
    });

    const getScore = (att: { correctCount: number; totalCount: number; score?: number }) =>
      att.score && att.score > 0
        ? att.score
        : att.totalCount > 0
          ? Math.round((att.correctCount / att.totalCount) * 1000)
          : 0;

    // Chỉ lấy kết quả điểm cao nhất của mỗi người dùng
    const userBestMap = new Map<number, typeof attempts[0]>();
    for (const att of attempts) {
      if (
        !userBestMap.has(att.userId) ||
        getScore(att) > getScore(userBestMap.get(att.userId)!)
      ) {
        userBestMap.set(att.userId, att);
      }
    }

    const uniqueAttempts = Array.from(userBestMap.values()).sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const durA =
        a.finishedAt && a.startedAt
          ? a.finishedAt.getTime() - a.startedAt.getTime()
          : 999999;
      const durB =
        b.finishedAt && b.startedAt
          ? b.finishedAt.getTime() - b.startedAt.getTime()
          : 999999;
      return durA - durB;
    });

    const top10 = uniqueAttempts.slice(0, 10).map((att, index) => {
      const durationSec =
        att.finishedAt && att.startedAt
          ? Math.round(
              (att.finishedAt.getTime() - att.startedAt.getTime()) / 1000,
            )
          : 0;

      return {
        rank: index + 1,
        userId: att.userId,
        displayName: att.user.displayName,
        avatarUrl: att.user.avatarUrl,
        correctCount: att.correctCount,
        totalCount: att.totalCount,
        score: getScore(att),
        durationSec,
      };
    });

    return top10;
  }

  /** Chi tiết bài làm dành cho trang kết quả */
  async getAttemptDetail(userId: number, setId: number, attemptId?: number) {
    let attempt;
    if (attemptId) {
      attempt = await this.prisma.testAttempt.findUnique({
        where: { id: attemptId },
        include: {
          set: {
            include: {
              language: { select: { id: true, code: true, name: true } },
              topic: { select: { id: true, name: true } },
              questions: { where: { status: QuestionStatus.active } },
            },
          },
          answers: true,
        },
      });
    } else {
      attempt = await this.prisma.testAttempt.findFirst({
        where: { userId, setId, finishedAt: { not: null } },
        orderBy: { finishedAt: 'desc' },
        include: {
          set: {
            include: {
              language: { select: { id: true, code: true, name: true } },
              topic: { select: { id: true, name: true } },
              questions: { where: { status: QuestionStatus.active } },
            },
          },
          answers: true,
        },
      });
    }

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy dữ liệu lượt làm bài');
    }

    const durationSec = attempt.finishedAt && attempt.startedAt
      ? Math.round((attempt.finishedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0;

    const answerByQuestionId = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const questionById = new Map(attempt.set.questions.map((q) => [q.id, q]));

    const review = attempt.questionOrder.map((qid) => {
      const q = questionById.get(qid);
      const ans = answerByQuestionId.get(qid);

      return {
        questionId: qid,
        prompt: q?.prompt || '',
        term: q?.term || null,
        passage: q?.passage || null,
        options: q?.options || [],
        chosenIndex: ans?.chosenIndex ?? null,
        answerIndex: q?.answerIndex ?? 0,
        isCorrect: ans?.isCorrect ?? false,
        explanation: q?.explanation || null,
      };
    });

    const leaderboard = await this.getLeaderboard(attempt.setId);
    const myRank = leaderboard.find((item) => item.userId === userId)?.rank || null;

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      durationSec,
      score:
        attempt.score && attempt.score > 0
          ? attempt.score
          : attempt.totalCount > 0
            ? Math.round((attempt.correctCount / attempt.totalCount) * 1000)
            : 0,
      set: {
        id: attempt.set.id,
        title: attempt.set.title,
        framework: attempt.set.framework,
        level: attempt.set.level,
        language: attempt.set.language,
        topic: attempt.set.topic,
      },
      review,
      myRank,
      leaderboard,
    };
  }
}
