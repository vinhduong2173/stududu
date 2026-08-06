import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { QuestionSource, QuestionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiQuestionGeneratorService } from './ai-question-generator.service';
import { FileExtractorService } from './file-extractor.service';
import { QuestionValidatorService } from './question-validator.service';
import {
  QuestionSetsService,
  REQUIRED_QUESTION_COUNT,
} from './question-sets.service';

/**
 * Hai luật giữ cửa publish khỏi trở nên vô nghĩa (question-set-design.md mục 4):
 * bộ đề đúng REQUIRED_QUESTION_COUNT câu, và lượt làm thử phải đi qua đúng bộ câu
 * đang dùng — không phải một lượt cũ làm hồi bộ còn dở dang.
 */

const SET_ID = 1;

function question(id: number) {
  return { id, status: QuestionStatus.active, prompt: `Câu đã có số ${id}?` };
}

/** Lượt làm thử của Admin đã đi qua đúng những câu có id trong `coveredIds` */
function trial(id: number, coveredIds: number[], finishedAt = new Date()) {
  return {
    id,
    correctCount: coveredIds.length,
    totalCount: coveredIds.length,
    finishedAt,
    questionOrder: coveredIds,
  };
}

/** Dòng câu hỏi như service ghi xuống DB */
type PersistedRow = {
  source: QuestionSource;
  sourceMeta: unknown;
};

function buildService(state: {
  activeQuestions?: { id: number; status: QuestionStatus }[];
  trials?: ReturnType<typeof trial>[];
  /** Thử thách đang chạy trên bộ đề này, nếu có */
  runningChallenge?: { title: string } | null;
}) {
  const activeQuestions = state.activeQuestions ?? [];
  const trials = state.trials ?? [];
  const prismaMock = {
    testQuestion: {
      findMany: jest.fn().mockResolvedValue(activeQuestions),
      count: jest.fn().mockResolvedValue(activeQuestions.length),
      aggregate: jest.fn().mockResolvedValue({ _max: { orderIndex: null } }),
      // Khai báo kiểu tham số để test đọc lại được payload mà không phải ép any
      createMany: jest.fn(
        (args: { data: PersistedRow[] }): Promise<{ count: number }> =>
          Promise.resolve({ count: args.data.length }),
      ),
    },
    testAttempt: {
      findMany: jest.fn(
        (args: { where: unknown }): Promise<ReturnType<typeof trial>[]> => {
          void args;
          return Promise.resolve(trials);
        },
      ),
    },
    communityChallenge: {
      findFirst: jest.fn().mockResolvedValue(state.runningChallenge ?? null),
    },
    questionSet: {
      findUnique: jest.fn().mockResolvedValue({
        id: SET_ID,
        questions: activeQuestions,
        language: { id: 1, code: 'en', name: 'English' },
        topic: { id: 1, name: 'Gia đình' },
      }),
      update: jest.fn().mockResolvedValue({ id: SET_ID }),
    },
  };

  return Test.createTestingModule({
    providers: [
      QuestionSetsService,
      { provide: PrismaService, useValue: prismaMock },
      { provide: FileExtractorService, useValue: {} },
      { provide: AiQuestionGeneratorService, useValue: {} },
      QuestionValidatorService,
    ],
  })
    .compile()
    .then((ref) => ({
      service: ref.get(QuestionSetsService),
      prismaMock,
    }));
}

const fullSet = Array.from({ length: REQUIRED_QUESTION_COUNT }, (_, i) =>
  question(i + 1),
);
const fullSetIds = fullSet.map((q) => q.id);

describe('QuestionSetsService — cửa publish', () => {
  it('lượt làm thử phủ hết bộ câu hiện tại → mở cửa publish', async () => {
    const { service } = await buildService({
      activeQuestions: fullSet,
      trials: [trial(100, fullSetIds)],
    });

    const gate = await service.getPublishGate(SET_ID);

    expect(gate.hasEnoughQuestions).toBe(true);
    expect(gate.hasAdminTrial).toBe(true);
    expect(gate.trialOutdated).toBe(false);
    expect(gate.canPublish).toBe(true);
    // questionOrder là chi tiết nội bộ, không rò ra response
    expect(gate.adminTrial).not.toHaveProperty('questionOrder');
  });

  it('lượt làm thử cũ chỉ phủ 3 câu → KHÔNG tính, báo là đã lỗi thời', async () => {
    const { service } = await buildService({
      activeQuestions: fullSet,
      trials: [trial(100, [1, 2, 3])],
    });

    const gate = await service.getPublishGate(SET_ID);

    expect(gate.hasEnoughQuestions).toBe(true);
    expect(gate.hasAdminTrial).toBe(false);
    expect(gate.trialOutdated).toBe(true);
    expect(gate.canPublish).toBe(false);
  });

  it('thay một câu sau khi làm thử → lượt cũ hết hiệu lực', async () => {
    // câu 20 bị retire, câu 21 vào thay — lượt cũ chưa hề thấy câu 21
    const swapped = [...fullSet.slice(0, 19), question(21)];
    const { service } = await buildService({
      activeQuestions: swapped,
      trials: [trial(100, fullSetIds)],
    });

    expect((await service.getPublishGate(SET_ID)).canPublish).toBe(false);
  });

  it('publish khi lượt làm thử đã lỗi thời → báo đúng lý do, không báo "chưa làm thử"', async () => {
    const { service } = await buildService({
      activeQuestions: fullSet,
      trials: [trial(100, [1, 2, 3])],
    });

    await expect(service.publish(1, SET_ID)).rejects.toThrow(
      /đã đổi câu hỏi kể từ lần làm thử/i,
    );
  });

  it('chưa đủ câu → chặn publish kể cả khi đã làm thử', async () => {
    const partial = fullSet.slice(0, 19);
    const { service } = await buildService({
      activeQuestions: partial,
      trials: [
        trial(
          100,
          partial.map((q) => q.id),
        ),
      ],
    });

    const gate = await service.getPublishGate(SET_ID);
    expect(gate.hasAdminTrial).toBe(true);
    expect(gate.canPublish).toBe(false);
    await expect(service.publish(1, SET_ID)).rejects.toThrow(
      new RegExp(`đúng ${REQUIRED_QUESTION_COUNT} câu`, 'i'),
    );
  });
});

describe('QuestionSetsService — trần số câu mỗi bộ', () => {
  const validQuestion = (n: number) => ({
    type: 'grammar',
    prompt: `Câu hỏi số ${n}?`,
    options: [`A${n}`, `B${n}`, `C${n}`, `D${n}`],
    answerIndex: 0,
  });

  it('nhập vượt quá số chỗ còn trống → từ chối cả lô, nói rõ dư mấy câu', async () => {
    const { service, prismaMock } = await buildService({
      activeQuestions: fullSet.slice(0, 15), // còn 5 chỗ
    });

    await expect(
      service.importQuestions(1, SET_ID, {
        questions: Array.from({ length: 10 }, (_, i) =>
          validQuestion(i + 1),
        ) as never,
        aiGenerated: true,
      }),
    ).rejects.toThrow(BadRequestException);

    // Chặn TRƯỚC khi ghi — không được nhập nửa vời rồi mới báo lỗi
    expect(prismaMock.testQuestion.createMany).not.toHaveBeenCalled();
  });

  it('bộ đã đủ câu → thêm tay bị chặn với gợi ý xoá bớt câu cũ', async () => {
    const { service, prismaMock } = await buildService({
      activeQuestions: fullSet,
    });

    await expect(
      service.addManualQuestion(1, SET_ID, validQuestion(99) as never),
    ).rejects.toThrow(/đã đủ 20 câu/i);
    expect(prismaMock.testQuestion.createMany).not.toHaveBeenCalled();
  });

  it('vừa khít số chỗ trống → cho nhập', async () => {
    const { service, prismaMock } = await buildService({
      activeQuestions: fullSet.slice(0, 15), // còn 5 chỗ
    });

    await service.importQuestions(1, SET_ID, {
      questions: Array.from({ length: 5 }, (_, i) =>
        validQuestion(i + 1),
      ) as never,
      aiGenerated: true,
      sourceMeta: { model: 'gemini-2.0-flash' },
    });

    expect(prismaMock.testQuestion.createMany).toHaveBeenCalledTimes(1);
    const rows = prismaMock.testQuestion.createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(5);
    // BR-53: câu AI sinh giữ nguyên nguồn kèm sourceMeta truy vết (BR-49/BR-57)
    expect(rows[0].source).toBe(QuestionSource.ai_generated);
    expect(rows[0].sourceMeta).toEqual({ model: 'gemini-2.0-flash' });
  });
});

describe('QuestionSetsService — gỡ phát hành', () => {
  it('thử thách đang chạy dùng bộ này → không cho gỡ phát hành', async () => {
    const { service, prismaMock } = await buildService({
      activeQuestions: fullSet,
      runningChallenge: { title: 'Thử thách tuần này' },
    });

    await expect(service.unpublish(1, SET_ID)).rejects.toThrow(
      /Thử thách tuần này/,
    );
    expect(prismaMock.questionSet.update).not.toHaveBeenCalled();
  });

  it('không có thử thách nào đang chạy → gỡ phát hành bình thường', async () => {
    const { service, prismaMock } = await buildService({
      activeQuestions: fullSet,
      runningChallenge: null,
    });

    await service.unpublish(1, SET_ID);
    expect(prismaMock.questionSet.update).toHaveBeenCalled();
  });
});

describe('getPublishGate — vai trò của lượt được đọc lên', () => {
  it('chỉ đọc lượt đã nộp của Admin', async () => {
    const { service, prismaMock } = await buildService({
      activeQuestions: fullSet,
      trials: [trial(100, fullSetIds)],
    });

    await service.getPublishGate(SET_ID);

    const where = prismaMock.testAttempt.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      setId: SET_ID,
      finishedAt: { not: null },
      user: { role: UserRole.admin },
    });
  });
});
