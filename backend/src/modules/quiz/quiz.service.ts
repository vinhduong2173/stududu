import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiQuizParserService } from './ai-quiz-parser.service';
import { CreateQuizDto, SubmitQuizDto, ExplainQuestionDto, SaveFeedbackDto } from './dto/quiz.dto';
import { QuestionType, Prisma, MessageType } from '@prisma/client';

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiParser: AiQuizParserService,
  ) {}

  async parseFileBuffer(buffer: Buffer, mimeType: string, filename: string) {
    return this.aiParser.parseFileBuffer(buffer, mimeType, filename);
  }

  async parseText(text: string) {
    return this.aiParser.parseText(text);
  }

  async createQuiz(creatorId: number, dto: CreateQuizDto) {
    return this.prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          creatorId,
          title: dto.title,
          description: dto.description,
          languageId: dto.languageId,
          timeLimitMinutes: dto.timeLimitMinutes ?? null,
        },
      });

      if (dto.questions && dto.questions.length > 0) {
        await tx.quizQuestion.createMany({
          data: dto.questions.map((q, index) => ({
            quizId: quiz.id,
            order: index + 1,
            questionText: q.questionText,
            type: q.type,
            options: q.options ? (q.options as unknown as Prisma.InputJsonValue) : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        });
      }

      return tx.quiz.findUnique({
        where: { id: quiz.id },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async getMyQuizzes(userId: number) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { creatorId: userId },
      include: {
        _count: { select: { questions: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      questionCount: q._count.questions,
      submissionCount: q._count.submissions,
      createdAt: q.createdAt,
    }));
  }

  async getQuizById(id: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        questions: { orderBy: { order: 'asc' } },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi này');
    }

    return quiz;
  }

  async submitQuiz(userId: number, quizId: number, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi này');
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const breakdown = quiz.questions.map((q) => {
      const userAnswer = dto.answers[q.id] || dto.answers[String(q.order)] || '';
      let isCorrect = false;

      if (q.type === QuestionType.multiple_choice) {
        const cleanUser = userAnswer.trim().toUpperCase().charAt(0);
        const cleanCorrect = q.correctAnswer.trim().toUpperCase().charAt(0);
        isCorrect = cleanUser === cleanCorrect;
      } else {
        isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        order: q.order,
        questionText: q.questionText,
        userAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect,
      };
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const submission = await this.prisma.quizSubmission.create({
      data: {
        quizId,
        userId,
        score,
        totalQuestions,
        answers: dto.answers as unknown as Prisma.InputJsonValue,
      },
    });

    // Nếu bài thi được làm từ khung Chat (có conversationId), tự động gửi tin nhắn quiz_result báo kết quả cho người tạo đề
    if (dto.conversationId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true },
        });

        await this.prisma.message.create({
          data: {
            conversationId: dto.conversationId,
            senderId: userId,
            type: MessageType.quiz_result,
            content: `Kết quả bài thi "${quiz.title}": ${score}% (${correctCount}/${totalQuestions} câu)`,
            payload: {
              submissionId: submission.id,
              quizId: quiz.id,
              quizTitle: quiz.title,
              score,
              correctCount,
              totalQuestions,
              studentName: user?.displayName || 'Học viên',
            } as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (err) {
        // Ignored error if chat message fails
      }
    }

    return {
      submissionId: submission.id,
      quizId,
      quizTitle: quiz.title,
      score,
      correctCount,
      totalQuestions,
      submittedAt: submission.submittedAt,
      breakdown,
    };
  }

  async getSubmissionDetails(userId: number, submissionId: number) {
    const sub = await this.prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        quiz: {
          include: {
            creator: { select: { id: true, displayName: true, avatarUrl: true } },
            questions: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!sub) {
      throw new NotFoundException('Không tìm thấy bài nộp thi này');
    }

    // Chỉ người tạo đề hoặc chính người làm bài mới được xem
    const isCreator = sub.quiz.creatorId === userId;
    const isStudent = sub.userId === userId;
    if (!isCreator && !isStudent) {
      throw new ForbiddenException('Bạn không có quyền xem bài nộp này');
    }

    const answersMap = (sub.answers as Record<string, string>) || {};
    let correctCount = 0;

    const breakdown = sub.quiz.questions.map((q) => {
      const userAnswer = answersMap[q.id] || answersMap[String(q.order)] || '';
      let isCorrect = false;

      if (q.type === QuestionType.multiple_choice) {
        const cleanUser = userAnswer.trim().toUpperCase().charAt(0);
        const cleanCorrect = q.correctAnswer.trim().toUpperCase().charAt(0);
        isCorrect = cleanUser === cleanCorrect;
      } else {
        isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        order: q.order,
        questionText: q.questionText,
        type: q.type,
        options: q.options ? (q.options as string[]) : [],
        userAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect,
      };
    });

    const qFeedbacks = (sub.questionFeedbacks as Record<string, string> | null) || {};

    return {
      submissionId: sub.id,
      quizId: sub.quizId,
      quizTitle: sub.quiz.title,
      creatorId: sub.quiz.creatorId,
      creatorName: sub.quiz.creator.displayName,
      isCreator,
      isStudent,
      studentName: sub.user.displayName,
      studentAvatar: sub.user.avatarUrl,
      score: sub.score,
      correctCount,
      totalQuestions: sub.totalQuestions,
      submittedAt: sub.submittedAt,
      feedback: sub.feedback,
      questionFeedbacks: qFeedbacks,
      breakdown,
    };
  }

  async saveSubmissionFeedback(userId: number, submissionId: number, dto: SaveFeedbackDto) {
    const sub = await this.prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: { quiz: { select: { creatorId: true } } },
    });

    if (!sub) {
      throw new NotFoundException('Không tìm thấy bài nộp thi này');
    }

    if (sub.quiz.creatorId !== userId) {
      throw new ForbiddenException('Chỉ người tạo đề thi mới có quyền ghi nhận xét');
    }

    // Merge questionFeedbacks mới vào dữ liệu đã có (để không xóa nhận xét cũ khi lưu từng câu)
    const existingQF = (sub.questionFeedbacks as Record<string, string> | null) || {};
    const mergedQF = dto.questionFeedbacks
      ? { ...existingQF, ...dto.questionFeedbacks }
      : existingQF;

    return this.prisma.quizSubmission.update({
      where: { id: submissionId },
      data: {
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
        questionFeedbacks: mergedQF as any,
      },
    });
  }

  /** Deprecated — student now uses getSubmissionDetails directly */
  async getStudentFeedback(userId: number, submissionId: number) {
    return this.getSubmissionDetails(userId, submissionId);
  }

  async explainQuestion(dto: ExplainQuestionDto) {
    return this.aiParser.explainQuestionWithGemini(dto);
  }

  async getSubmissions(userId: number, quizId: number) {
    return this.prisma.quizSubmission.findMany({
      where: { quizId },
      include: { user: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async updateQuiz(userId: number, quizId: number, dto: CreateQuizDto) {
    const existing = await this.prisma.quiz.findFirst({
      where: { id: quizId, creatorId: userId },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy hoặc không có quyền chỉnh sửa đề thi này');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          title: dto.title,
          description: dto.description,
          languageId: dto.languageId,
          timeLimitMinutes: dto.timeLimitMinutes ?? null,
        },
      });

      await tx.quizQuestion.deleteMany({
        where: { quizId },
      });

      if (dto.questions && dto.questions.length > 0) {
        await tx.quizQuestion.createMany({
          data: dto.questions.map((q, index) => ({
            quizId,
            order: index + 1,
            questionText: q.questionText,
            type: q.type,
            options: q.options ? (q.options as unknown as Prisma.InputJsonValue) : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        });
      }

      return tx.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async deleteQuiz(userId: number, quizId: number) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, creatorId: userId },
    });
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy hoặc không có quyền xóa đề thi này');
    }
    return this.prisma.quiz.delete({ where: { id: quizId } });
  }
}
