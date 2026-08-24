import { Test } from '@nestjs/testing';
import { PlanCode, SubscriptionStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';
import { QuotaExceededException } from './quota-exceeded.exception';
import { UsageCounterService } from './services/usage-counter.service';
import { effectivePlan } from './utils/effective-plan.util';
import { dailyPeriodStart } from './utils/usage-period.util';

const DAY = 24 * 60 * 60 * 1000;

function subscription(
  status: SubscriptionStatus,
  overrides: Record<string, unknown> = {},
) {
  return {
    plan: PlanCode.pro,
    status,
    currentPeriodEnd: new Date(Date.now() + 5 * DAY),
    graceEndsAt: null,
    ...overrides,
  };
}

async function buildService(opts: {
  subscription?: unknown;
  used?: number;
  savedWords?: number;
}) {
  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        timezone: 'VN',
        subscription: opts.subscription ?? null,
      }),
    },
    userSavedWord: {
      count: jest.fn().mockResolvedValue(opts.savedWords ?? 0),
    },
  };
  const usageMock = {
    read: jest.fn().mockResolvedValue(opts.used ?? 0),
    increment: jest.fn().mockResolvedValue((opts.used ?? 0) + 1),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      EntitlementsService,
      { provide: PrismaService, useValue: prismaMock },
      { provide: UsageCounterService, useValue: usageMock },
      { provide: I18nService, useValue: { t: jest.fn((k: string) => k) } },
    ],
  }).compile();

  return { service: moduleRef.get(EntitlementsService), usageMock };
}

describe('EntitlementsService (US-41)', () => {
  it('AC1 — trả về { allowed, limit, used, resetAt } theo gói Free', async () => {
    const { service } = await buildService({ used: 27 });

    const check = await service.can(1, 'translate.lookup');

    expect(check).toMatchObject({ allowed: true, limit: 30, used: 27 });
    expect(check.resetAt).not.toBeNull();
    expect(check.warn).toBe(true); // US-39 AC2 — còn 3 lượt
  });

  it('AC3 — past_due còn trong grace period vẫn được hạn mức Pro', async () => {
    const { service } = await buildService({
      subscription: subscription(SubscriptionStatus.past_due, {
        currentPeriodEnd: new Date(Date.now() - DAY),
        graceEndsAt: new Date(Date.now() + 2 * DAY),
      }),
      used: 100,
    });

    const check = await service.can(1, 'translate.lookup');

    expect(check.plan).toBe(PlanCode.pro);
    expect(check.limit).toBe(500);
    expect(check.allowed).toBe(true);
  });

  it('hết grace period thì trở về hạn mức Free', async () => {
    const { service } = await buildService({
      subscription: subscription(SubscriptionStatus.past_due, {
        graceEndsAt: new Date(Date.now() - DAY),
      }),
    });

    expect((await service.can(1, 'translate.lookup')).limit).toBe(30);
  });

  it('US-39 AC1 — chạm hạn mức thì ném 403 QUOTA_EXCEEDED, không trừ thêm lượt', async () => {
    const { service, usageMock } = await buildService({ used: 30 });

    await expect(
      service.assertAndConsume(1, 'translate.lookup'),
    ).rejects.toThrow(QuotaExceededException);
    expect(usageMock.increment).not.toHaveBeenCalled();
  });

  it('BR-45 — trần Like của Pro là 50/ngày, không phải vô hạn', async () => {
    const { service } = await buildService({
      subscription: subscription(SubscriptionStatus.active),
      used: 50,
    });

    const check = await service.can(1, 'match.like');

    expect(check.limit).toBe(50);
    expect(check.allowed).toBe(false);
  });

  it('BR-43 — trần sổ từ đếm theo dữ liệu thật và chỉ chặn thêm mới', async () => {
    const { service } = await buildService({ savedWords: 800 });

    const check = await service.can(1, 'vocabulary.save');

    expect(check).toMatchObject({ kind: 'cap', limit: 100, used: 800 });
    expect(check.allowed).toBe(false);
    expect(check.resetAt).toBeNull(); // cap không reset
  });

  it('match.advanced_filter là boolean — Free tắt, Pro bật', async () => {
    const free = await buildService({});
    const pro = await buildService({
      subscription: subscription(SubscriptionStatus.active),
    });

    expect(await free.service.isEnabled(1, 'match.advanced_filter')).toBe(
      false,
    );
    expect(await pro.service.isEnabled(1, 'match.advanced_filter')).toBe(true);
  });
});

describe('effectivePlan (BR-41, BR-42)', () => {
  it('canceling giữ quyền Pro tới hết chu kỳ đã trả tiền', () => {
    const plan = effectivePlan(subscription(SubscriptionStatus.canceling));
    expect(plan).toBe(PlanCode.pro);
  });

  it('pending_payment chưa có quyền Pro', () => {
    const plan = effectivePlan(
      subscription(SubscriptionStatus.pending_payment),
    );
    expect(plan).toBe(PlanCode.free);
  });

  it('không có subscription → free', () => {
    expect(effectivePlan(null)).toBe(PlanCode.free);
  });
});

describe('dailyPeriodStart (BR-40, US-39 AC3)', () => {
  it('mốc reset là 00:00 theo giờ người dùng, không theo giờ server', () => {
    // 20/08/2026 20:00 UTC = 21/08 03:00 giờ VN → kỳ đếm đã sang ngày 21
    const now = new Date('2026-08-20T20:00:00.000Z');

    const vn = dailyPeriodStart(now, 7 * 60);
    const utc = dailyPeriodStart(now, 0);

    expect(vn.toISOString()).toBe('2026-08-20T17:00:00.000Z'); // 21/08 00:00 +07
    expect(utc.toISOString()).toBe('2026-08-20T00:00:00.000Z');
    expect(vn.getTime()).toBeGreaterThan(utc.getTime());
  });
});
