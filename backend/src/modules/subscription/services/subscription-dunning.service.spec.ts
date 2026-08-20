import { Test } from '@nestjs/testing';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionDunningService } from './subscription-dunning.service';
import { SubscriptionNotifierService } from './subscription-notifier.service';

const overdue = {
  id: 1,
  userId: 1,
  providerSubId: 'sub_1',
  status: SubscriptionStatus.active,
  currentPeriodEnd: new Date(Date.now() - 1000),
};

async function buildService(provider: Record<string, unknown>) {
  const prismaMock = {
    subscription: {
      findMany: jest.fn().mockResolvedValue([overdue]),
      update: jest.fn().mockResolvedValue(overdue),
    },
    paymentTransaction: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
  const billingMock = {
    renewSucceeded: jest.fn().mockResolvedValue(overdue),
    markPastDue: jest.fn().mockResolvedValue(overdue),
    downgrade: jest.fn().mockResolvedValue(overdue),
  };
  const notifierMock = {
    paymentFailed: jest.fn(),
    downgraded: jest.fn(),
    renewalReminder: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      SubscriptionDunningService,
      { provide: PrismaService, useValue: prismaMock },
      { provide: SubscriptionBillingService, useValue: billingMock },
      { provide: SubscriptionNotifierService, useValue: notifierMock },
      { provide: PAYMENT_PROVIDER, useValue: provider },
    ],
  }).compile();

  return {
    service: moduleRef.get(SubscriptionDunningService),
    billingMock,
    provider,
  };
}

describe('SubscriptionDunningService — chống trừ tiền hai lần', () => {
  it('Stripe tự gia hạn → job KHÔNG tự trừ tiền, không đụng vòng đời', async () => {
    const chargeRenewal = jest.fn();
    const { service, billingMock } = await buildService({
      name: 'stripe',
      handlesRecurringItself: true,
      chargeRenewal,
    });

    expect(await service.chargeDueRenewals(new Date())).toBe(0);
    expect(await service.retryPastDue(new Date())).toBe(0);
    expect(chargeRenewal).not.toHaveBeenCalled();
    expect(billingMock.renewSucceeded).not.toHaveBeenCalled();
    expect(billingMock.markPastDue).not.toHaveBeenCalled();
  });

  it('MockProvider → job vẫn tự chạy chu kỳ để demo được §5.3', async () => {
    const chargeRenewal = jest
      .fn()
      .mockResolvedValue({ succeeded: true, providerRef: 'pi_1' });
    const { service, billingMock } = await buildService({
      name: 'mock',
      handlesRecurringItself: false,
      chargeRenewal,
    });

    expect(await service.chargeDueRenewals(new Date())).toBe(1);
    expect(chargeRenewal).toHaveBeenCalledTimes(1);
    expect(billingMock.renewSucceeded).toHaveBeenCalledTimes(1);
  });

  it('gia hạn thất bại → chuyển past_due và báo cho người dùng (BR-41)', async () => {
    const { service, billingMock } = await buildService({
      name: 'mock',
      handlesRecurringItself: false,
      chargeRenewal: jest
        .fn()
        .mockResolvedValue({ succeeded: false, failureReason: 'card_declined' }),
    });

    await service.chargeDueRenewals(new Date());

    expect(billingMock.markPastDue).toHaveBeenCalledWith(overdue, 'card_declined', 1);
    expect(billingMock.renewSucceeded).not.toHaveBeenCalled();
  });

  it('hạ cấp khi hết grace period vẫn chạy ở mọi provider (§5.3 T+3)', async () => {
    const { service, billingMock } = await buildService({
      name: 'stripe',
      handlesRecurringItself: true,
    });

    expect(await service.downgradeExpiredGrace(new Date())).toBe(1);
    expect(billingMock.downgrade).toHaveBeenCalledTimes(1);
  });
});
