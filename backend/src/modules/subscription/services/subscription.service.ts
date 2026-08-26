import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PlanCode, Subscription, SubscriptionStatus } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../../prisma/prisma.service';
import { EntitlementsService } from '../../entitlements/entitlements.service';
import { effectivePlan } from '../../entitlements/utils/effective-plan.util';
import {
  BILLING_CURRENCY,
  PRO_MONTHLY_PRICE_VND,
} from '../constants/subscription.constant';
import { ConfirmMockCheckoutDto } from '../dto/subscription.dto';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { MockPaymentProvider } from '../payment/mock.provider';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionNotifierService } from './subscription-notifier.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: SubscriptionBillingService,
    private readonly entitlements: EntitlementsService,
    private readonly notifier: SubscriptionNotifierService,
    private readonly i18n: I18nService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /** US-37 — trạng thái gói + mức dùng hiện tại cho trang /pricing. */
  async getState(userId: number, tzOffsetMinutes?: number) {
    let subscription = await this.billing.ensure(userId);

    // Tự động đồng bộ trạng thái thanh toán từ cổng nếu môi trường dev không nhận được Webhook
    if (
      subscription.status === SubscriptionStatus.pending_payment &&
      subscription.providerSubId &&
      this.provider.checkSessionPaid
    ) {
      const res = await this.provider.checkSessionPaid(
        subscription.providerSubId,
      );
      if (res.isPaid) {
        subscription = await this.billing.activate(subscription, {
          providerName: this.provider.name,
          providerSubId: res.realSubId ?? subscription.providerSubId,
        });
        await this.notifier.activated(userId);
      }
    }

    const [entitlements] = await Promise.all([
      this.entitlements.summary(userId, tzOffsetMinutes),
    ]);

    return {
      plan: effectivePlan(subscription),
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      graceEndsAt: subscription.graceEndsAt,
      canceledAt: subscription.canceledAt,
      provider: this.provider.name,
      price: { amount: PRO_MONTHLY_PRICE_VND, currency: BILLING_CURRENCY },
      entitlements,
    };
  }

  /** US-38 — mở phiên thanh toán, subscription sang `pending_payment`. */
  async startCheckout(userId: number) {
    const subscription = await this.billing.ensure(userId);
    if (effectivePlan(subscription) === PlanCode.pro) {
      throw this.badRequest('translation.subscription.alreadyPro');
    }

    const session = await this.provider.createCheckoutSession(
      userId,
      PlanCode.pro,
    );

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.pending_payment,
        providerName: this.provider.name,
        providerCustomerId: session.providerCustomerId ?? null,
        // Giữ tạm sessionId ở đây; activate() sẽ thay bằng id subscription thật.
        providerSubId: session.sessionId,
        updatedAt: new Date(),
      },
    });

    return { url: session.url, sessionId: session.sessionId };
  }

  /**
   * BR-42 / US-42 AC1 — huỷ chủ động: giữ quyền Pro tới hết chu kỳ đã trả tiền.
   */
  async cancel(userId: number) {
    const subscription = await this.requireOwn(userId);
    if (subscription.status !== SubscriptionStatus.active) {
      throw this.badRequest('translation.subscription.cannotCancel');
    }

    if (subscription.providerSubId) {
      await this.provider.cancelSubscription(subscription.providerSubId);
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.canceling,
        canceledAt: new Date(),
      },
    });
  }

  /** US-42 AC3 — khôi phục trước khi hết hạn, bật lại tự gia hạn. */
  async resume(userId: number) {
    const subscription = await this.requireOwn(userId);
    if (subscription.status !== SubscriptionStatus.canceling) {
      throw this.badRequest('translation.subscription.cannotResume');
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.active, canceledAt: null },
    });
  }

  /**
   * Xác nhận thanh toán ở MockProvider (R-01). Với Stripe việc này đến bằng
   * webhook `checkout.session.completed`, không qua endpoint này.
   */
  async confirmMockCheckout(userId: number, dto: ConfirmMockCheckoutDto) {
    const mock = this.requireMockProvider();
    const subscription = await this.requireOwn(userId);
    if (subscription.providerSubId !== dto.sessionId) {
      throw this.badRequest('translation.subscription.checkoutNotFound');
    }

    const card = dto.cardNumber.replace(/\s+/g, '');
    if (!mock.isCardAccepted(card)) {
      // US-38 AC3 — thẻ bị từ chối: giữ nguyên free + ghi lại giao dịch failed.
      await this.billing.recordPayment(subscription.id, {
        amount: PRO_MONTHLY_PRICE_VND,
        status: 'failed',
        failureReason: 'card_declined',
      });
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.free, providerSubId: null },
      });
      throw this.badRequest('translation.subscription.cardDeclined');
    }

    const activated = await this.billing.activate(subscription, {
      providerName: mock.name,
      providerSubId: mock.buildSubscriptionId(card),
    });
    await this.notifier.activated(userId);
    return activated;
  }

  private async requireOwn(userId: number): Promise<Subscription> {
    return this.billing.ensure(userId);
  }

  private requireMockProvider(): MockPaymentProvider {
    if (!(this.provider instanceof MockPaymentProvider)) {
      throw this.badRequest('translation.subscription.mockOnly');
    }
    return this.provider;
  }

  private badRequest(key: string): BadRequestException {
    return new BadRequestException(
      this.i18n.t(key, { lang: I18nContext.current()?.lang }),
    );
  }
}
