import { Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SubscriptionWebhookService } from './services/subscription-webhook.service';

/**
 * SRS §7.3 — webhook từ cổng thanh toán. KHÔNG đặt sau JwtAuthGuard: cổng gọi
 * bằng chữ ký của nó, không mang token người dùng.
 *
 * Body phải là raw Buffer để verify chữ ký được — main.ts đăng ký express.raw
 * cho tiền tố `/webhooks` trước bộ parse JSON chung.
 */
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhooks: SubscriptionWebhookService) {}

  @Post(':provider')
  handle(
    @Param('provider') provider: string,
    @Req() request: Request,
    @Headers('stripe-signature') signature?: string,
  ) {
    const rawBody = Buffer.isBuffer(request.body)
      ? request.body
      : Buffer.from(JSON.stringify(request.body ?? {}), 'utf8');

    return this.webhooks.handle(provider, rawBody, signature);
  }
}
