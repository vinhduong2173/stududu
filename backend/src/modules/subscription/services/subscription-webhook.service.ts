import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  GRACE_PERIOD_DAYS,
  PRO_MONTHLY_PRICE_VND,
} from '../constants/subscription.constant';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type {
  PaymentProvider,
  ProviderWebhookEvent,
} from '../payment/payment-provider.interface';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionNotifierService } from './subscription-notifier.service';

export interface WebhookResult {
  received: true;
  duplicate: boolean;
  type?: string;
}

/** Sự kiện SRS §7.3 — cổng thanh toán báo về vòng đời subscription. */
@Injectable()
export class SubscriptionWebhookService {
  private readonly logger = new Logger(SubscriptionWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: SubscriptionBillingService,
    private readonly notifier: SubscriptionNotifierService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async handle(
    providerName: string,
    rawBody: Buffer,
    signature?: string,
  ): Promise<WebhookResult> {
    if (providerName !== this.provider.name) {
      throw new NotFoundException(`Unknown payment provider: ${providerName}`);
    }

    const event = this.provider.verifyWebhook(rawBody, signature);

    // Cổng gửi nhiều loại event ngoài 4 loại ở §7.3, và event không tra được
    // người dùng thì tuyệt đối không đoán bừa — cả hai đều trả 200 rồi thôi.
    if (event.type === 'ignored' || !event.userId) {
      this.logger.debug(
        `Bỏ qua webhook: type=${event.type} userId=${event.userId}`,
      );
      return { received: true, duplicate: false, type: event.type };
    }

    // BR-44 / US-38 AC5 — cùng eventId đến lần hai thì bỏ qua, không cộng chu kỳ.
    if (!(await this.claimEvent(event))) {
      this.logger.warn(
        `Bỏ qua webhook trùng: ${event.provider}/${event.eventId}`,
      );
      return { received: true, duplicate: true, type: event.type };
    }

    await this.dispatch(event);
    return { received: true, duplicate: false, type: event.type };
  }

  /** Trả về false nếu event đã được xử lý trước đó. */
  private async claimEvent(event: ProviderWebhookEvent): Promise<boolean> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: event.provider,
          eventId: event.eventId,
          type: event.type,
        },
      });
      return true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return false;
      }
      throw err;
    }
  }

  private async dispatch(event: ProviderWebhookEvent): Promise<void> {
    const subscription = await this.billing.ensure(event.userId);

    switch (event.type) {
      case 'checkout.session.completed':
        return this.onCheckoutCompleted(subscription, event);
      case 'checkout.session.failed':
        return this.onCheckoutFailed(subscription, event);
      case 'invoice.payment_succeeded':
        return this.onRenewalSucceeded(subscription, event);
      case 'invoice.payment_failed':
        return this.onRenewalFailed(subscription, event);
      case 'customer.subscription.deleted':
        return this.onProviderCanceled(subscription);
      case 'ignored':
        return;
    }
  }

  private async onCheckoutCompleted(
    subscription: Subscription,
    event: ProviderWebhookEvent,
  ): Promise<void> {
    await this.billing.activate(subscription, {
      providerName: event.provider,
      providerSubId: event.providerSubId,
      providerCustomerId: event.providerCustomerId,
      amount: event.amount,
      providerRef: event.providerRef,
    });
    await this.notifier.activated(subscription.userId);
  }

  private async onCheckoutFailed(
    subscription: Subscription,
    event: ProviderWebhookEvent,
  ): Promise<void> {
    // US-38 AC3 — giữ nguyên `free`, chỉ ghi lại giao dịch thất bại.
    await this.billing.recordPayment(subscription.id, {
      amount: event.amount ?? PRO_MONTHLY_PRICE_VND,
      status: 'failed',
      failureReason: event.failureReason ?? 'card_declined',
    });
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.free, providerSubId: null },
    });
  }

  private async onRenewalSucceeded(
    subscription: Subscription,
    event: ProviderWebhookEvent,
  ): Promise<void> {
    await this.billing.renewSucceeded(subscription, event.providerRef);
  }

  private async onRenewalFailed(
    subscription: Subscription,
    event: ProviderWebhookEvent,
  ): Promise<void> {
    await this.billing.markPastDue(subscription, event.failureReason);
    await this.notifier.paymentFailed(subscription.userId, GRACE_PERIOD_DAYS);
  }

  private async onProviderCanceled(subscription: Subscription): Promise<void> {
    await this.billing.downgrade(subscription);
    await this.notifier.downgraded(subscription.userId);
  }
}
