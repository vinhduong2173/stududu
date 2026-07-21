import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CreateScheduleDto, RespondScheduleDto, CancelScheduleDto } from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(user.sub, dto);
  }

  @Patch(':id/respond')
  respond(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondScheduleDto,
  ) {
    return this.scheduleService.respond(user.sub, id, dto);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelScheduleDto,
  ) {
    return this.scheduleService.cancel(user.sub, id, dto);
  }

  @Get('upcoming')
  upcoming(@CurrentUser() user: JwtPayload) {
    return this.scheduleService.upcoming(user.sub);
  }
}
