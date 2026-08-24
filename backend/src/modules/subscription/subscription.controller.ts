import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TzOffset } from '../../common/decorators/tz-offset.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { ConfirmMockCheckoutDto } from './dto/subscription.dto';
import { SubscriptionJobsService } from './services/subscription-jobs.service';
import { SubscriptionService } from './services/subscription.service';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly entitlements: EntitlementsService,
    private readonly jobs: SubscriptionJobsService,
  ) {}

  // US-37 — trạng thái gói + hạn mức + mức dùng hôm nay
  @Get('me')
  getMine(@CurrentUser() user: JwtPayload, @TzOffset() tz?: number) {
    return this.subscriptions.getState(user.sub, tz);
  }

  // US-41 AC1 — chỉ riêng bảng entitlement (giao diện gọi khi cần làm mới)
  @Get('entitlements')
  getEntitlements(@CurrentUser() user: JwtPayload, @TzOffset() tz?: number) {
    return this.entitlements.summary(user.sub, tz);
  }

  // US-38 — mở phiên thanh toán
  @Post('checkout')
  checkout(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.startCheckout(user.sub);
  }

  // US-38 — xác nhận thẻ ở MockProvider (Stripe dùng webhook thay cho endpoint này)
  @Post('checkout/confirm')
  confirmCheckout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmMockCheckoutDto,
  ) {
    return this.subscriptions.confirmMockCheckout(user.sub, dto);
  }

  // US-42 AC1 — huỷ, giữ quyền tới hết chu kỳ đã trả tiền (BR-42)
  @Post('cancel')
  cancel(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.cancel(user.sub);
  }

  // US-42 AC3 — khôi phục trước khi hết hạn
  @Post('resume')
  resume(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.resume(user.sub);
  }

  // Chạy tay chuỗi dunning để demo được §5.3 mà không phải chờ 3 ngày thật
  @Post('jobs/run')
  @Roles(UserRole.admin)
  @UseGuards(RolesGuard)
  runJobs() {
    return this.jobs.run();
  }
}
