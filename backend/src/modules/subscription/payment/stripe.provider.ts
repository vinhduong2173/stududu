import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanCode } from '@prisma/client';
import Stripe from 'stripe';
import {
  BILLING_CURRENCY,
  PRO_MONTHLY_PRICE_VND,
} from '../constants/subscription.constant';
import {
  CheckoutSession,
  PaymentProvider,
  ProviderEventType,
  ProviderWebhookEvent,
} from './payment-provider.interface';
import { extractUserId, mapEventType } from './stripe-event.mapper';

/**
 * SRS §7.2 — Stripe TEST MODE.
 *
 * Thật ở đây gồm: giao diện nhập thẻ của Stripe, token hoá thẻ, chu kỳ tự gia
 * hạn, chữ ký webhook. Thứ KHÔNG thật là dòng tiền — test mode không luân
 * chuyển tiền. Live mode cần pháp nhân doanh nghiệp, mà Stripe lại không nhận
 * doanh nghiệp đặt tại Việt Nam (§11-Q5). Đây là giới hạn pháp lý, không phải
 * giới hạn của thiết kế: đổi sang cổng Việt Nam chỉ là viết thêm một class.
 */
@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe';
  /** Stripe tự chạy chu kỳ gia hạn và báo về bằng invoice.* — job nền đứng ngoài. */
  readonly handlesRecurringItself = true;

  private readonly logger = new Logger(StripePaymentProvider.name);
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.requireEnv('STRIPE_SECRET_KEY'));
  }

  async createCheckoutSession(
    userId: number,
    planCode: PlanCode,
  ): Promise<CheckoutSession> {
    const base = this.frontendUrl();
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      // Đường về để tra ngược ra người dùng khi webhook báo thanh toán xong.
      client_reference_id: String(userId),
      line_items: [this.buildLineItem()],
      subscription_data: {
        // Invoice của các chu kỳ sau chỉ tra ngược được người dùng qua đây.
        metadata: { userId: String(userId), plan: planCode },
      },
      success_url: `${base}/pricing?checkout=success`,
      cancel_url: `${base}/pricing?checkout=cancel`,
    });

    if (!session.url) {
      throw new Error('Stripe không trả về URL thanh toán');
    }
    return {
      url: session.url,
      sessionId: session.id,
      providerCustomerId:
        typeof session.customer === 'string' ? session.customer : undefined,
    };
  }

  /** BR-42 — huỷ ở cuối chu kỳ, không cắt ngay phần người dùng đã trả tiền. */
  async cancelSubscription(providerSubId: string): Promise<void> {
    await this.stripe.subscriptions.update(providerSubId, {
      cancel_at_period_end: true,
    });
  }

  verifyWebhook(rawBody: Buffer, signature?: string): ProviderWebhookEvent {
    if (!signature) throw new Error('Thiếu header stripe-signature');

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.requireEnv('STRIPE_WEBHOOK_SECRET'),
    );

    const type: ProviderEventType | null = mapEventType(event.type);
    if (!type) {
      // Stripe gửi rất nhiều loại event; loại không quan tâm vẫn phải trả 200.
      this.logger.debug(`Bỏ qua event không dùng tới: ${event.type}`);
      return {
        provider: this.name,
        eventId: event.id,
        type: 'ignored',
        userId: 0,
      };
    }

    return {
      ...extractUserId(event),
      provider: this.name,
      eventId: event.id,
      type,
    };
  }

  /**
   * Ưu tiên Price ID tạo sẵn trên Dashboard; không có thì dựng giá inline để
   * chạy được ngay mà không phải cấu hình trước.
   *
   * VND là zero-decimal currency của Stripe: `unit_amount` là số tiền thật,
   * KHÔNG nhân 100 như USD.
   */
  private buildLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
    const priceId = this.config.get<string>('STRIPE_PRICE_ID');
    if (priceId) return { price: priceId, quantity: 1 };

    return {
      quantity: 1,
      price_data: {
        currency: BILLING_CURRENCY.toLowerCase(),
        unit_amount: PRO_MONTHLY_PRICE_VND,
        recurring: { interval: 'month' },
        product_data: { name: 'Stududu Pro' },
      },
    };
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  private requireEnv(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) throw new Error(`Thiếu biến môi trường ${key}`);
    return value;
  }
}
