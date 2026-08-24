import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CallsService } from './calls.service';
import type { CallHistoryItem, IceConfigResponse } from './calls.types';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /** Mục 7.1 — cấu hình STUN/TURN lấy từ BE, không hardcode ở FE. */
  @Get('ice-config')
  getIceConfig(): IceConfigResponse {
    return this.callsService.getIceConfig();
  }

  @Get('history/:conversationId')
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<CallHistoryItem[]> {
    return this.callsService.getHistory(user.sub, conversationId);
  }
}
