import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CreateReportDto } from './dto/create-report.dto';
import { EndorseDto } from './dto/endorse.dto';
import { TrustService } from './trust.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Post('reports')
  report(@CurrentUser() user: JwtPayload, @Body() dto: CreateReportDto) {
    return this.trustService.report(user.sub, dto);
  }

  @Get('blocks')
  getBlocks(@CurrentUser() user: JwtPayload) {
    return this.trustService.getBlocks(user.sub);
  }

  @Post('blocks/:userId')
  block(@CurrentUser() user: JwtPayload, @Param('userId', ParseIntPipe) userId: number) {
    return this.trustService.block(user.sub, userId);
  }

  @Delete('blocks/:userId')
  unblock(@CurrentUser() user: JwtPayload, @Param('userId', ParseIntPipe) userId: number) {
    return this.trustService.unblock(user.sub, userId);
  }

  // FS-26 — Endorsement định tính (BR-13: chỉ đếm theo nhãn, không rating)
  @Post('trust/endorse')
  endorse(@CurrentUser() user: JwtPayload, @Body() dto: EndorseDto) {
    return this.trustService.endorse(user.sub, dto);
  }

  @Get('users/:id/endorsements')
  getEndorsements(@Param('id', ParseIntPipe) id: number) {
    return this.trustService.getEndorsements(id);
  }

  @Get('users/:id/endorsements/given')
  getGivenEndorsements(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.trustService.getGivenEndorsements(user.sub, id);
  }
}
