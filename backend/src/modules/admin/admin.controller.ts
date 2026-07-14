import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { AdminService } from './admin.service';
import {
  CreateLanguageDto,
  CreateTopicDto,
  UpdateLanguageDto,
  UpdateTopicDto,
} from './dto/catalog.dto';
import { ModerateDto } from './dto/moderate.dto';

// US-19 AC3 — chỉ role = admin; member thường bị RolesGuard chặn (403)
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  getReports(@Query('status') status?: ReportStatus) {
    return this.adminService.getReports(status);
  }

  @Patch('reports/:id')
  updateReport(@Param('id', ParseIntPipe) id: number, @Body('status') status: ReportStatus) {
    return this.adminService.updateReportStatus(id, status);
  }

  @Post('users/:id/moderate')
  moderate(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: ModerateDto,
  ) {
    return this.adminService.moderate(admin.sub, targetUserId, dto);
  }

  @Get('users/:id/violations')
  getViolations(@Param('id', ParseIntPipe) targetUserId: number) {
    return this.adminService.getViolationHistory(targetUserId);
  }

  @Get('users/:id')
  getUserDetail(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.getUserDetail(userId);
  }

  // US-21 — quản lý danh mục (admin thấy cả mục đã ẩn)
  @Get('languages')
  getAllLanguages() {
    return this.adminService.getAllLanguages();
  }

  @Get('topics')
  getAllTopics() {
    return this.adminService.getAllTopics();
  }

  @Post('languages')
  createLanguage(@Body() dto: CreateLanguageDto) {
    return this.adminService.createLanguage(dto);
  }

  @Patch('languages/:id')
  updateLanguage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLanguageDto) {
    return this.adminService.updateLanguage(id, dto);
  }

  @Post('topics')
  createTopic(@Body() dto: CreateTopicDto) {
    return this.adminService.createTopic(dto);
  }

  @Patch('topics/:id')
  updateTopic(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTopicDto) {
    return this.adminService.updateTopic(id, dto);
  }
}
