import { PlanCode } from '@prisma/client';

/** Các sự kiện cần xử lý — SRS §7.3. */
export type ProviderEventType =
  | 'checkout.session.completed'
  | 'checkout.session.failed'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.subscription.deleted'
  /** Event cổng gửi nhưng ta không quan tâm — vẫn phải trả 200 cho cổng. */
  | 'ignored';

/** Sự kiện đã được chuẩn hoá — vòng đời subscription không biết cổng nào gửi. */
export interface ProviderWebhookEvent {
  provider: string;
  eventId: string;
  type: ProviderEventType;
  userId: number;
  providerCustomerId?: string;
  providerSubId?: string;
  amount?: number;
  providerRef?: string;
  failureReason?: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
  providerCustomerId?: string;
}

export interface RenewalResult {
  succeeded: boolean;
  providerRef?: string;
  failureReason?: string;
}

/**
 * SRS §7.1 — adapter thanh toán. Đổi sang cổng Việt Nam sau này là viết thêm
 * một class, không đụng vào vòng đời subscription.
 */
export interface PaymentProvider {
  readonly name: string;

  /**
   * true = cổng tự chạy chu kỳ gia hạn và báo về bằng webhook (Stripe).
   * false = job nền của ta phải tự gọi `chargeRenewal` (MockProvider).
   *
   * Cờ này tồn tại để tránh TRỪ TIỀN HAI LẦN: nếu job vẫn tự tính chu kỳ trong
   * khi Stripe cũng đang tự gia hạn, một người dùng sẽ bị cộng hai chu kỳ.
   */
  readonly handlesRecurringItself: boolean;

  createCheckoutSession(
    userId: number,
    planCode: PlanCode,
  ): Promise<CheckoutSession>;

  cancelSubscription(providerSubId: string): Promise<void>;

  verifyWebhook(rawBody: Buffer, signature?: string): ProviderWebhookEvent;

  /**
   * Trừ tiền một chu kỳ. Chỉ provider có `handlesRecurringItself = false` mới
   * cần cài đặt: với Stripe, cổng tự làm và báo về bằng webhook.
   */
  chargeRenewal?(input: {
    userId: number;
    providerSubId: string | null;
    amount: number;
    attemptNumber: number;
  }): Promise<RenewalResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
