import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TzOffset } from '../../common/decorators/tz-offset.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { TranslateDto } from './dto/translate.dto';
import { TranslateService } from './translate.service';

@Controller('translate')
@UseGuards(JwtAuthGuard)
export class TranslateController {
  constructor(
    private readonly translateService: TranslateService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /**
   * EP-11 — hạn mức `translate.lookup` (SRS §3.2): Google Translate tính tiền
   * theo ký tự nên đây là hạng mục có chi phí biên thật. Trừ lượt TRƯỚC khi gọi
   * API; chạm hạn mức trả 403 QUOTA_EXCEEDED (US-39 AC1).
   *
   * `quota` trả kèm để giao diện hiện cảnh báo "còn N lượt" (US-39 AC2).
   */
  @Post()
  async translate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TranslateDto,
    @TzOffset() tz?: number,
  ) {
    const quota = await this.entitlements.assertAndConsume(
      user.sub,
      'translate.lookup',
      { tzOffsetMinutes: tz },
    );
    const result = await this.translateService.translate(dto);
    return { ...result, quota };
  }
}
