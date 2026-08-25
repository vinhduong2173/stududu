import { Injectable } from '@nestjs/common';
import { PlanCode, Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BILLING_CURRENCY,
  GRACE_PERIOD_DAYS,
  PRO_MONTHLY_PRICE_VND,
  addDays,
  addOneMonth,
} from '../constants/subscription.constant';

interface ActivateInput {
  providerName: string;
  providerSubId?: string | null;
  providerCustomerId?: string | null;
  amount?: number;
  providerRef?: string | null;
}

/**
 * Các chuyển trạng thái của vòng đời subscription (SRS §5.1). Tách khỏi
 * SubscriptionService để webhook và job nền dùng chung đúng một bộ quy tắc.
 */
@Injectable()
export class SubscriptionBillingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy hoặc tạo bản ghi `free` — mọi người dùng đều có subscription row. */
  async ensure(userId: number): Promise<Subscription> {
    return this.prisma.subscription.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  /** `pending_payment` → `active` (US-38 AC1). */
  async activate(
    subscription: Subscription,
    input: ActivateInput,
  ): Promise<Subscription> {
    const now = new Date();
    const amount = input.amount ?? PRO_MONTHLY_PRICE_VND;

    await this.recordPayment(subscription.id, {
      amount,
      status: 'succeeded',
      providerRef: input.providerRef ?? null,
    });

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: PlanCode.pro,
        status: SubscriptionStatus.active,
        currentPeriodStart: now,
        currentPeriodEnd: addOneMonth(now),
        graceEndsAt: null,
        canceledAt: null,
        renewalReminderAt: null,
        providerName: input.providerName,
        providerSubId: input.providerSubId ?? subscription.providerSubId,
        providerCustomerId:
          input.providerCustomerId ?? subscription.providerCustomerId,
      },
    });
  }

  /** Gia hạn thành công — cộng thêm 1 chu kỳ và xoá grace (US-40 AC3). */
  async renewSucceeded(
    subscription: Subscription,
    providerRef?: string | null,
  ): Promise<Subscription> {
    const base = this.renewalBase(subscription);

    await this.recordPayment(subscription.id, {
      amount: PRO_MONTHLY_PRICE_VND,
      status: 'succeeded',
      providerRef: providerRef ?? null,
    });

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.active,
        currentPeriodStart: base,
        currentPeriodEnd: addOneMonth(base),
        graceEndsAt: null,
        renewalReminderAt: null,
      },
    });
  }

  /**
   * BR-41 — gia hạn thất bại: sang `past_due` nhưng GIỮ NGUYÊN quyền Pro trong
   * 3 ngày ân hạn (US-40 AC2).
   */
  async markPastDue(
    subscription: Subscription,
    failureReason?: string | null,
    attemptNumber = 1,
  ): Promise<Subscription> {
    await this.recordPayment(subscription.id, {
      amount: PRO_MONTHLY_PRICE_VND,
      status: 'failed',
      failureReason: failureReason ?? 'unknown',
      attemptNumber,
    });

    if (subscription.status === SubscriptionStatus.past_due) {
      return subscription; // grace đã chạy, không gia hạn thêm thời gian ân hạn
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.past_due,
        graceEndsAt: addDays(new Date(), GRACE_PERIOD_DAYS),
      },
    });
  }

  /**
   * Hạ về Free. BR-43 — chỉ đổi quyền, KHÔNG đụng vào dữ liệu người dùng.
   */
  async downgrade(subscription: Subscription): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: PlanCode.free,
        status: SubscriptionStatus.free,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        graceEndsAt: null,
        renewalReminderAt: null,
        providerSubId: null,
      },
    });
  }

  async recordPayment(
    subscriptionId: number,
    input: {
      amount: number;
      status: string;
      failureReason?: string | null;
      attemptNumber?: number;
      providerRef?: string | null;
    },
  ): Promise<void> {
    await this.prisma.paymentTransaction.create({
      data: {
        subscriptionId,
        amount: input.amount,
        currency: BILLING_CURRENCY,
        status: input.status,
        failureReason: input.failureReason ?? null,
        attemptNumber: input.attemptNumber ?? 1,
        providerRef: input.providerRef ?? null,
      },
    });
  }

  /** Gia hạn nối tiếp chu kỳ cũ nếu chưa hết hạn, tránh mất ngày đã trả tiền. */
  private renewalBase(subscription: Subscription): Date {
    const now = new Date();
    const end = subscription.currentPeriodEnd;
    return end && end.getTime() > now.getTime() ? end : now;
  }
}
