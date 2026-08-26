import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { QueryGroupDto } from './dto/query-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { GroupMemberRole } from '@prisma/client';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async extractViewerId(authorization?: string): Promise<number | undefined> {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) return undefined;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(user.sub, dto);
  }

  @Get()
  async findAll(
    @Headers('authorization') authorization?: string,
    @Query() query?: QueryGroupDto,
  ) {
    const viewerId = await this.extractViewerId(authorization);
    return this.groupsService.findAll(viewerId, query);
  }

  @Get(':idOrSlug')
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Headers('authorization') authorization?: string,
  ) {
    const viewerId = await this.extractViewerId(authorization);
    return this.groupsService.findOne(idOrSlug, viewerId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  joinGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: JoinGroupDto,
  ) {
    return this.groupsService.joinGroup(id, user.sub, dto);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.leaveGroup(id, user.sub);
  }

  @Get(':id/posts')
  async getGroupPosts(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ) {
    const viewerId = await this.extractViewerId(authorization);
    return this.groupsService.getGroupPosts(id, viewerId);
  }

  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  createGroupPost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { content?: string; imageUrl?: string },
  ) {
    return this.groupsService.createGroupPost(id, user.sub, dto.content || '', dto.imageUrl);
  }

  @Get(':id/requests')
  @UseGuards(JwtAuthGuard)
  getJoinRequests(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.getJoinRequests(id, user.sub);
  }

  @Post(':id/requests/:requestId/approve')
  @UseGuards(JwtAuthGuard)
  approveJoinRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    return this.groupsService.approveJoinRequest(id, requestId, user.sub);
  }

  @Post(':id/requests/:requestId/reject')
  @UseGuards(JwtAuthGuard)
  rejectJoinRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    return this.groupsService.rejectJoinRequest(id, requestId, user.sub);
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') idOrSlug: string,
    @Headers('authorization') authorization?: string,
  ) {
    const viewerId = await this.extractViewerId(authorization);
    return this.groupsService.getMembers(idOrSlug, viewerId);
  }

  @Delete(':id/members/:targetUserId')
  @UseGuards(JwtAuthGuard)
  kickMember(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.groupsService.kickMember(id, targetUserId, user.sub);
  }

  @Patch(':id/members/:targetUserId/role')
  @UseGuards(JwtAuthGuard)
  updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body() dto: { role: GroupMemberRole },
  ) {
    return this.groupsService.updateMemberRole(id, targetUserId, dto.role, user.sub);
  }

  @Post(':id/members/:targetUserId/ban')
  @UseGuards(JwtAuthGuard)
  banMember(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body() dto: { durationDays: number },
  ) {
    return this.groupsService.banMember(id, targetUserId, dto.durationDays, user.sub);
  }

  @Get(':id/reports')
  @UseGuards(JwtAuthGuard)
  getGroupReports(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.getGroupReports(id, user.sub);
  }

  @Post(':id/reports/:reportId/resolve')
  @UseGuards(JwtAuthGuard)
  resolveGroupReport(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('reportId', ParseIntPipe) reportId: number,
  ) {
    return this.groupsService.resolveGroupReport(id, reportId, user.sub);
  }

  @Post(':id/members/:targetUserId/mute')
  @UseGuards(JwtAuthGuard)
  muteMember(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body() dto: { durationDays: number },
  ) {
    return this.groupsService.muteMember(id, targetUserId, dto.durationDays, user.sub);
  }

  @Patch(':id/members/:targetUserId/pre-approve')
  @UseGuards(JwtAuthGuard)
  toggleMemberPreApproval(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body() dto: { isPreApproved: boolean },
  ) {
    return this.groupsService.toggleMemberPreApproval(id, targetUserId, dto.isPreApproved, user.sub);
  }

  @Post(':id/members/:targetUserId/report')
  @UseGuards(JwtAuthGuard)
  reportMember(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Body() dto: { reason: string },
  ) {
    return this.groupsService.reportMember(id, user.sub, targetUserId, dto.reason);
  }

  @Patch(':id/settings')
  @UseGuards(JwtAuthGuard)
  updateGroupSettings(
    @CurrentUser() user: JwtPayload,
    @Param('id') idOrSlug: string,
    @Body() dto: { postApprovalRequired: boolean },
  ) {
    return this.groupsService.updateGroupSettings(idOrSlug, dto.postApprovalRequired, user.sub);
  }

  @Get(':id/pending-posts')
  @UseGuards(JwtAuthGuard)
  getPendingGroupPosts(
    @CurrentUser() user: JwtPayload,
    @Param('id') idOrSlug: string,
  ) {
    return this.groupsService.getPendingGroupPosts(idOrSlug, user.sub);
  }

  @Post(':id/pending-posts/:postId/approve')
  @UseGuards(JwtAuthGuard)
  approveGroupPost(
    @CurrentUser() user: JwtPayload,
    @Param('id') idOrSlug: string,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.groupsService.approveGroupPost(idOrSlug, postId, user.sub);
  }

  @Post(':id/pending-posts/:postId/reject')
  @UseGuards(JwtAuthGuard)
  rejectGroupPost(
    @CurrentUser() user: JwtPayload,
    @Param('id') idOrSlug: string,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.groupsService.rejectGroupPost(idOrSlug, postId, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') idOrSlug: string,
  ) {
    return this.groupsService.deleteGroup(idOrSlug, user.sub);
  }
}
