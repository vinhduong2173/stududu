import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanCode } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CheckoutSession,
  PaymentProvider,
  ProviderWebhookEvent,
  RenewalResult,
  SessionCheckResult,
} from './payment-provider.interface';

/**
 * SRS §7.1 / R-01 — provider dự phòng khi không đăng ký được Stripe test key từ
 * Việt Nam. Mô phỏng đúng bộ số thẻ test của Stripe (§7.2) để demo được cả
 * luồng thành công, luồng bị từ chối và luồng dunning.
 */
export const TEST_CARDS = {
  success: '4242424242424242',
  /** Thanh toán đầu thành công, các lần GIA HẠN sau đó thất bại. */
  renewalFails: '4000000000000341',
} as const;

/** Đánh dấu ngay trong providerSubId để job gia hạn biết phải cho thất bại. */
const DUNNING_SUFFIX = '_dunning';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  /** Không có cổng thật đứng sau nên job nền phải tự chạy chu kỳ gia hạn. */
  readonly handlesRecurringItself = false;
  private readonly logger = new Logger(MockPaymentProvider.name);

  constructor(private readonly config: ConfigService) {}

  createCheckoutSession(
    userId: number,
    planCode: PlanCode,
  ): Promise<CheckoutSession> {
    const sessionId = `cs_mock_${randomUUID()}`;
    const base =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    this.logger.log(
      `Mở phiên thanh toán mô phỏng ${sessionId} (user ${userId})`,
    );
    return Promise.resolve({
      sessionId,
      providerCustomerId: `cus_mock_${userId}`,
      url: `${base}/pricing/checkout?session=${sessionId}&plan=${planCode}`,
    });
  }

  cancelSubscription(providerSubId: string): Promise<void> {
    this.logger.log(`Huỷ tự gia hạn phía cổng: ${providerSubId}`);
    return Promise.resolve();
  }

  verifyWebhook(rawBody: Buffer): ProviderWebhookEvent {
    const parsed = JSON.parse(rawBody.toString('utf8')) as ProviderWebhookEvent;
    return { ...parsed, provider: this.name };
  }

  chargeRenewal(input: {
    providerSubId: string | null;
    attemptNumber: number;
  }): Promise<RenewalResult> {
    if (input.providerSubId?.endsWith(DUNNING_SUFFIX)) {
      return Promise.resolve({
        succeeded: false,
        failureReason: 'card_declined',
      });
    }
    return Promise.resolve({
      succeeded: true,
      providerRef: `pi_mock_${randomUUID()}`,
    });
  }

  /** Sinh providerSubId cho phiên vừa thanh toán, theo số thẻ đã dùng. */
  buildSubscriptionId(cardNumber: string): string {
    const id = `sub_mock_${randomUUID()}`;
    return cardNumber === TEST_CARDS.renewalFails
      ? `${id}${DUNNING_SUFFIX}`
      : id;
  }

  /** Thẻ nào được coi là hợp lệ ở bước thanh toán đầu tiên (US-38 AC1/AC3). */
  isCardAccepted(cardNumber: string): boolean {
    return (
      cardNumber === TEST_CARDS.success ||
      cardNumber === TEST_CARDS.renewalFails
    );
  }

  checkSessionPaid(_sessionId: string): Promise<SessionCheckResult> {
    return Promise.resolve({ isPaid: false });
  }
}
