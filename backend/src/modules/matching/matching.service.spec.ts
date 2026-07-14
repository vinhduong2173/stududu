import { Test } from '@nestjs/testing';
import { LanguageRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MatchingService,
  SUGGESTIONS_MIN,
  SUGGESTIONS_PAGE_SIZE,
} from './matching.service';

// FS-08 — 3 trường hợp bắt buộc: đủ ≥10 ngay, phải nới 1-2 bậc, pool quá nhỏ

const VI = 1;
const EN = 2;
const TOPIC_TRAVEL = 10;

/** Hồ sơ của "tôi": dạy VI (native), học EN level 3, thích topic Du lịch, muốn đối tác level 3 */
const me = {
  id: 1,
  intent: 'Giao tiếp casual',
  languages: [
    { languageId: VI, role: LanguageRole.native, level: null },
    { languageId: EN, role: LanguageRole.learning, level: '3' },
  ],
  interests: [{ topicId: TOPIC_TRAVEL }],
  matchPreference: { levelDesired: '3' },
};

/** Ứng viên bù trừ (dạy EN, học VI) — tùy chọn topic chung / level học VI */
function candidate(id: number, opts: { sharedTopic?: boolean; learnLevel?: string } = {}) {
  return {
    id,
    displayName: `User ${id}`,
    avatarUrl: null,
    bio: null,
    intent: null,
    lastActive: new Date(2026, 0, id), // id lớn → hoạt động gần hơn
    dob: null,
    city: null,
    status: UserStatus.active,
    languages: [
      {
        id: id * 10 + 1,
        languageId: EN,
        role: LanguageRole.native,
        level: null,
        language: { id: EN, name: 'English' },
      },
      {
        id: id * 10 + 2,
        languageId: VI,
        role: LanguageRole.learning,
        level: opts.learnLevel ?? '1',
        language: { id: VI, name: 'Tiếng Việt' },
      },
    ],
    interests: opts.sharedTopic
      ? [{ topicId: TOPIC_TRAVEL, topic: { id: TOPIC_TRAVEL, name: 'Du lịch' } }]
      : [],
  };
}

async function buildService(candidates: unknown[]) {
  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(me),
      findMany: jest.fn().mockResolvedValue(candidates),
    },
    block: { findMany: jest.fn().mockResolvedValue([]) },
    match: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const moduleRef = await Test.createTestingModule({
    providers: [MatchingService, { provide: PrismaService, useValue: prismaMock }],
  }).compile();

  return moduleRef.get(MatchingService);
}

describe('MatchingService.getSuggestions (FS-08)', () => {
  it('đủ ≥10 ứng viên chặt ngay từ đầu → trả đúng 10, không cắm cờ insufficient_pool', async () => {
    // 15 ứng viên đều có topic chung + đúng level mong muốn (bậc chặt nhất)
    const pool = Array.from({ length: 15 }, (_, i) =>
      candidate(100 + i, { sharedTopic: true, learnLevel: '3' }),
    );
    const service = await buildService(pool);

    const result = await service.getSuggestions(me.id);

    expect(result.items).toHaveLength(SUGGESTIONS_PAGE_SIZE); // tối đa 10/lần gọi
    expect(result.total).toBe(15);
    expect(result.insufficientPool).toBe(false);
    // pagination "xem thêm"
    const page2 = await service.getSuggestions(me.id, { offset: 10 });
    expect(page2.items).toHaveLength(5);
  });

  it('bậc chặt chỉ có 2 người → nới bỏ topic/level để gom đủ tối thiểu 6', async () => {
    const pool = [
      candidate(1, { sharedTopic: true, learnLevel: '3' }), // bậc chặt
      candidate(2, { sharedTopic: true, learnLevel: '3' }), // bậc chặt
      candidate(3, { learnLevel: '3' }), // nới (1): không topic chung, đúng level
      candidate(4, { learnLevel: '3' }),
      candidate(5, { sharedTopic: true, learnLevel: '1' }), // nới (2): lệch level
      candidate(6, { learnLevel: '2' }),
      candidate(7, { learnLevel: '1' }),
    ];
    const service = await buildService(pool);

    const result = await service.getSuggestions(me.id);

    expect(result.items.length).toBeGreaterThanOrEqual(SUGGESTIONS_MIN);
    expect(result.insufficientPool).toBe(false);
    // bù trừ ngôn ngữ vẫn là điều kiện bất biến — mọi ứng viên đều dạy EN
    for (const item of result.items) {
      expect(
        item.user.languages.some(
          (l: { role: string; languageId: number }) =>
            l.role === 'native' && l.languageId === EN,
        ),
      ).toBe(true);
    }
  });

  it('pool quá nhỏ (<6 sau khi nới hết) → trả số có được + insufficient_pool=true', async () => {
    const pool = [
      candidate(1, { sharedTopic: true, learnLevel: '3' }),
      candidate(2, { learnLevel: '1' }),
      candidate(3, { learnLevel: '2' }),
    ];
    const service = await buildService(pool);

    const result = await service.getSuggestions(me.id);

    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.insufficientPool).toBe(true);
  });
});
