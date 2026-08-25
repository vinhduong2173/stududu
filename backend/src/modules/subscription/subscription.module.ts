import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { NotificationModule } from '../notification/notification.module';
import { MockPaymentProvider } from './payment/mock.provider';
import { PAYMENT_PROVIDER } from './payment/payment-provider.interface';
import type { PaymentProvider } from './payment/payment-provider.interface';
import { StripePaymentProvider } from './payment/stripe.provider';
import { SubscriptionBillingService } from './services/subscription-billing.service';
import { SubscriptionDunningService } from './services/subscription-dunning.service';
import { SubscriptionJobsService } from './services/subscription-jobs.service';
import { SubscriptionNotifierService } from './services/subscription-notifier.service';
import { SubscriptionWebhookService } from './services/subscription-webhook.service';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionController } from './subscription.controller';
import { WebhookController } from './webhook.controller';

/**
 * Chọn cổng thanh toán lúc khởi động (SRS §7.1).
 *
 * Có STRIPE_SECRET_KEY → Stripe test mode: thẻ Visa thật, token hoá thật, tự
 * gia hạn thật, chữ ký webhook thật (chỉ dòng tiền là không thật — live mode
 * cần pháp nhân, xem §11-Q5).
 * Không có key → MockProvider, đúng phương án dự phòng R-01, để người mới clone
 * repo về vẫn chạy được toàn bộ luồng mà không cần đăng ký gì.
 */
function createPaymentProvider(
  config: ConfigService,
  stripe: StripePaymentProvider | null,
  mock: MockPaymentProvider,
): PaymentProvider {
  const logger = new Logger('PaymentProvider');
  if (config.get<string>('STRIPE_SECRET_KEY') && stripe) {
    logger.log('Dùng Stripe (test mode)');
    return stripe;
  }
  logger.warn('Thiếu STRIPE_SECRET_KEY — chạy MockProvider (R-01)');
  return mock;
}

/**
 * EP-11 · Monetization & Subscription.
 *
 * Business logic không biết đang chạy provider nào; đổi sang cổng Việt Nam sau
 * này là viết thêm một class và nối vào factory trên, không đụng vòng đời gói.
 */
@Module({
  imports: [AuthModule, EntitlementsModule, NotificationModule],
  controllers: [SubscriptionController, WebhookController],
  providers: [
    MockPaymentProvider,
    {
      // Khởi tạo Stripe SDK cần secret key; thiếu key thì để null, factory bên
      // dưới sẽ rơi về Mock thay vì làm sập cả ứng dụng lúc bootstrap.
      provide: StripePaymentProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('STRIPE_SECRET_KEY')
          ? new StripePaymentProvider(config)
          : null,
    },
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, StripePaymentProvider, MockPaymentProvider],
      useFactory: createPaymentProvider,
    },
    SubscriptionService,
    SubscriptionBillingService,
    SubscriptionWebhookService,
    SubscriptionDunningService,
    SubscriptionNotifierService,
    SubscriptionJobsService,
  ],
  exports: [SubscriptionService, SubscriptionBillingService],
})
export class SubscriptionModule {}
