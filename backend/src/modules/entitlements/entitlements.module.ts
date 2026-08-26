import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { UsageCounterService } from './services/usage-counter.service';

/**
 * BR-39 — cổng quyền duy nhất. Module nào cần chặn theo hạn mức thì import
 * module này, không tự đọc bảng `subscriptions`.
 */
@Module({
  providers: [EntitlementsService, UsageCounterService],
  exports: [EntitlementsService, UsageCounterService],
})
export class EntitlementsModule {}
