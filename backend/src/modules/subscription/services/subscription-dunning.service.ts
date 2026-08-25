import { Inject, Injectable, Logger } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DAY_MS,
  MAX_RENEWAL_ATTEMPTS,
  PRO_MONTHLY_PRICE_VND,
  RENEWAL_REMINDER_DAYS,
  addDays,
} from '../constants/subscription.constant';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionNotifierService } from './subscription-notifier.service';

/** Chuỗi dunning §5.3 — nhắc T-7, trừ tiền, retry T+1/T+2, hạ cấp T+3. */
@Injectable()
export class SubscriptionDunningService {
  private readonly logger = new Logger(SubscriptionDunningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: SubscriptionBillingService,
    private readonly notifier: SubscriptionNotifierService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /** §5.3 T-7 / US-40 AC1 — nhắc trước ngày gia hạn, mỗi chu kỳ đúng một lần. */
  async sendRenewalReminders(now: Date): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        renewalReminderAt: null,
        currentPeriodEnd: {
          gt: now,
          lte: addDays(now, RENEWAL_REMINDER_DAYS),
        },
      },
    });

    for (const sub of due) {
      await this.notifier.renewalReminder(
        sub.userId,
        sub.currentPeriodEnd as Date,
        PRO_MONTHLY_PRICE_VND,
      );
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { renewalReminderAt: now },
      });
    }
    return due.length;
  }

  /** §5.1 `active → active` khi trừ tiền thành công, ngược lại sang past_due. */
  async chargeDueRenewals(now: Date): Promise<number> {
    if (this.providerDrivesRenewal()) return 0;

    const due = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        currentPeriodEnd: { lte: now },
      },
    });

    for (const sub of due) await this.attemptRenewal(sub, 1);
    return due.length;
  }

  /** §5.3 T+1, T+2 — mỗi ngày một lần trong grace period (US-40 AC3). */
  async retryPastDue(now: Date): Promise<number> {
    if (this.providerDrivesRenewal()) return 0;

    const candidates = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.past_due,
        graceEndsAt: { gt: now },
      },
    });

    let retried = 0;
    for (const sub of candidates) {
      const attempts = await this.failedAttempts(sub.id);
      if (attempts >= MAX_RENEWAL_ATTEMPTS) continue;
      if (!(await this.dueForRetry(sub.id, now))) continue;

      await this.attemptRenewal(sub, attempts + 1);
      retried += 1;
    }
    return retried;
  }

  /** §5.3 T+3 / US-40 AC4 — hết ân hạn vẫn thất bại thì hạ về Free. */
  async downgradeExpiredGrace(now: Date): Promise<number> {
    const expired = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.past_due,
        graceEndsAt: { lte: now },
      },
    });

    for (const sub of expired) {
      await this.billing.downgrade(sub);
      await this.notifier.downgraded(sub.userId);
    }
    return expired.length;
  }

  /**
   * Với Stripe, chính cổng chạy chu kỳ gia hạn và retry rồi báo về bằng
   * `invoice.*`. Job nền mà tự trừ tiếp thì người dùng bị cộng hai chu kỳ —
   * nên ở chế độ đó job đứng ngoài hoàn toàn, chỉ webhook điều khiển vòng đời.
   */
  private providerDrivesRenewal(): boolean {
    return this.provider.handlesRecurringItself || !this.provider.chargeRenewal;
  }

  private async attemptRenewal(
    subscription: Subscription,
    attemptNumber: number,
  ): Promise<void> {
    const result = await this.provider.chargeRenewal!({
      userId: subscription.userId,
      providerSubId: subscription.providerSubId,
      amount: PRO_MONTHLY_PRICE_VND,
      attemptNumber,
    });

    if (result.succeeded) {
      await this.billing.renewSucceeded(subscription, result.providerRef);
      this.logger.log(`Gia hạn thành công cho user ${subscription.userId}`);
      return;
    }

    await this.billing.markPastDue(
      subscription,
      result.failureReason,
      attemptNumber,
    );
    await this.notifier.paymentFailed(
      subscription.userId,
      Math.max(0, MAX_RENEWAL_ATTEMPTS - attemptNumber),
    );
  }

  private async failedAttempts(subscriptionId: number): Promise<number> {
    return this.prisma.paymentTransaction.count({
      where: { subscriptionId, status: 'failed' },
    });
  }

  /** Giãn retry ra mỗi 24h dù job nền chạy vài phút một lần. */
  private async dueForRetry(
    subscriptionId: number,
    now: Date,
  ): Promise<boolean> {
    const last = await this.prisma.paymentTransaction.findFirst({
      where: { subscriptionId, status: 'failed' },
      orderBy: { createdAt: 'desc' },
    });
    if (!last) return true;
    return now.getTime() - last.createdAt.getTime() >= DAY_MS;
  }
}
