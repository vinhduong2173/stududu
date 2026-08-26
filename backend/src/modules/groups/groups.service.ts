import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { QueryGroupDto } from './dto/query-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { GroupMemberRole, GroupMemberStatus, GroupPrivacy } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name) || 'group';
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.group.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  async createGroup(userId: number, dto: CreateGroupDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    const group = await this.prisma.group.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        privacy: dto.privacy || GroupPrivacy.public,
        creatorId: userId,
        languageId: dto.languageId || null,
        topicId: dto.topicId || null,
        avatarUrl: dto.avatarUrl || null,
        coverUrl: dto.coverUrl || null,
        members: {
          create: {
            userId,
            role: GroupMemberRole.owner,
          },
        },
      },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        language: { select: { id: true, code: true, name: true } },
        topic: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    return {
      ...group,
      memberCount: group._count.members,
      userContext: {
        isMember: true,
        role: GroupMemberRole.owner,
        hasPendingRequest: false,
      },
    };
  }

  async findAll(viewerId?: number, query: QueryGroupDto = {}) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (query.languageId) {
      where.languageId = query.languageId;
    }

    if (viewerId && query.tab === 'my_groups') {
      where.members = {
        some: {
          userId: viewerId,
          status: 'active',
        },
      };
    } else if (viewerId && query.tab === 'created') {
      where.creatorId = viewerId;
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          creator: { select: { id: true, displayName: true, avatarUrl: true } },
          language: { select: { id: true, code: true, name: true } },
          topic: { select: { id: true, name: true } },
          _count: { select: { members: true } },
          ...(viewerId
            ? {
                members: { where: { userId: viewerId } },
                joinRequests: { where: { userId: viewerId, status: 'pending' } },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    const formattedGroups = groups.map((g) => {
      const userMember = viewerId ? g.members?.[0] : undefined;
      const pendingRequest = viewerId ? g.joinRequests?.[0] : undefined;

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        avatarUrl: g.avatarUrl,
        coverUrl: g.coverUrl,
        privacy: g.privacy,
        creator: g.creator,
        language: g.language,
        topic: g.topic,
        createdAt: g.createdAt,
        memberCount: g._count.members,
        postApprovalRequired: g.postApprovalRequired,
        userContext: {
          isMember: !!userMember && userMember.status === 'active',
          role: userMember?.role ?? null,
          hasPendingRequest: !!pendingRequest,
        },
      };
    });

    return {
      data: formattedGroups,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrSlug: string, viewerId?: number) {
    const isId = !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        language: { select: { id: true, code: true, name: true } },
        topic: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
        ...(viewerId
          ? {
              members: { where: { userId: viewerId } },
              joinRequests: { where: { userId: viewerId, status: 'pending' } },
            }
          : {}),
      },
    });

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    const userMember = viewerId ? group.members?.[0] : undefined;
    const pendingRequest = viewerId ? group.joinRequests?.[0] : undefined;
    const isMember = !!userMember && userMember.status === 'active';

    if (group.privacy === GroupPrivacy.private && !isMember && viewerId !== group.creatorId) {
      // Private group hidden details for non-members
    }

    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      avatarUrl: group.avatarUrl,
      coverUrl: group.coverUrl,
      privacy: group.privacy,
      creator: group.creator,
      language: group.language,
      topic: group.topic,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      postCount: group._count.posts,
      postApprovalRequired: group.postApprovalRequired,
      userContext: {
        isMember,
        role: userMember?.role ?? null,
        hasPendingRequest: !!pendingRequest,
      },
    };
  }

  async joinGroup(groupId: number, userId: number, dto: JoinGroupDto = {}) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existingMember) {
      if (existingMember.status === 'active') {
        return { message: 'Bạn đã là thành viên của nhóm này', isMember: true, hasPendingRequest: false };
      }
      throw new ForbiddenException('Tài khoản của bạn đã bị hạn chế trong nhóm này');
    }

    await this.prisma.groupJoinRequest.upsert({
      where: {
        groupId_userId_status: {
          groupId,
          userId,
          status: 'pending',
        },
      },
      create: {
        groupId,
        userId,
        message: dto.message?.trim() || null,
      },
      update: {
        message: dto.message?.trim() || null,
      },
    });

    try {
      const adminIds = await this.getAdminUserIds(groupId);
      const recipientIds = adminIds.filter((id) => id !== userId);
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
      if (recipientIds.length > 0) {
        await this.prisma.notification.createMany({
          data: recipientIds.map((adminId) => ({
            userId: adminId,
            senderId: userId,
            type: 'pending_join_request',
            message: `[Yêu cầu gia nhập] ${user?.displayName || 'Người dùng'} muốn gia nhập nhóm "${group.name}".`,
            referenceId: groupId,
          })),
        });
      }
    } catch (err) {
      console.error('Error notifying admins of join request:', err);
    }

    return { message: 'Đã gửi yêu cầu tham gia nhóm, vui lòng chờ quản trị viên phê duyệt', isMember: false, hasPendingRequest: true };
  }

  async leaveGroup(groupId: number, userId: number) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      throw new BadRequestException('Bạn chưa tham gia nhóm này');
    }

    if (member.role === GroupMemberRole.owner) {
      const otherMembers = await this.prisma.groupMember.findMany({
        where: { groupId, userId: { not: userId }, status: GroupMemberStatus.active },
        orderBy: { joinedAt: 'asc' },
      });

      if (otherMembers.length > 0) {
        const adminMember = otherMembers.find((m) => m.role === GroupMemberRole.admin);
        const nextOwner = adminMember || otherMembers[0];
        await this.prisma.groupMember.update({
          where: { id: nextOwner.id },
          data: { role: GroupMemberRole.owner },
        });
      } else {
        await this.prisma.group.delete({ where: { id: groupId } });
        return { message: 'Đã giải thể nhóm thành công' };
      }
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { message: 'Đã rời nhóm thành công' };
  }

  async getGroupPosts(groupId: number, viewerId?: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    if (group.privacy === GroupPrivacy.private && viewerId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: viewerId } },
      });
      if (!member || member.status !== 'active') {
        throw new ForbiddenException('Chỉ thành viên mới có thể xem bài viết trong nhóm riêng tư');
      }
    }

    const posts = await this.prisma.activityPost.findMany({
      where: { groupId, status: 'approved' },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return posts.map((p: any) => ({
      id: p.id,
      type: p.type,
      contentRef: p.contentRef,
      content: p.content,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      user: p.user,
      likeCount: p._count?.likes ?? 0,
      commentCount: p._count?.comments ?? 0,
      likedByMe: viewerId ? (p.likes?.length ?? 0) > 0 : false,
    }));
  }

  async createGroupPost(groupId: number, userId: number, content: string, imageUrl?: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.status !== 'active') {
      throw new ForbiddenException('Bạn phải là thành viên hoạt động của nhóm để đăng bài');
    }

    if (member.mutedUntil) {
      if (member.mutedUntil <= new Date()) {
        await this.prisma.groupMember.update({
          where: { id: member.id },
          data: { mutedUntil: null },
        });
      } else {
        const dateStr = new Date(member.mutedUntil).toLocaleDateString('vi-VN');
        throw new ForbiddenException(`Tài khoản của bạn đang bị cấm đăng bài trong nhóm đến ngày ${dateStr}`);
      }
    }

    // Nếu nhóm bật "Kiểm duyệt đăng bài" (postApprovalRequired = true),
    // tất cả mọi người (kể cả Admin / Owner) đều phải chờ duyệt (status = 'pending')
    const postStatus = group.postApprovalRequired ? 'pending' : 'approved';

    const post = await this.prisma.activityPost.create({
      data: {
        userId,
        groupId,
        type: 'user_post',
        content: content.trim(),
        imageUrl: imageUrl || null,
        status: postStatus,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (postStatus === 'pending') {
      try {
        const adminIds = await this.getAdminUserIds(groupId);
        const recipientIds = adminIds.filter((id) => id !== userId);
        if (recipientIds.length > 0) {
          await this.prisma.notification.createMany({
            data: recipientIds.map((adminId) => ({
              userId: adminId,
              senderId: userId,
              type: 'pending_group_post',
              message: `[Bài viết chờ duyệt] Có bài viết mới trong nhóm "${group.name}" cần được phê duyệt.`,
              referenceId: groupId,
            })),
          });
        }
      } catch (err) {
        console.error('Error notifying admins of pending post:', err);
      }
    }

    return {
      ...post,
      isPendingApproval: postStatus === 'pending',
    };
  }

  private async checkIsAdminOrOwner(groupId: number, userId: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');
    if (group.creatorId === userId) return group;

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (
      !member ||
      member.status !== 'active' ||
      (member.role !== GroupMemberRole.owner && member.role !== GroupMemberRole.admin)
    ) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền thực hiện thao tác này');
    }
    return group;
  }

  private async getAdminUserIds(groupId: number): Promise<number[]> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return [];

    const adminMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        status: GroupMemberStatus.active,
        role: { in: [GroupMemberRole.owner, GroupMemberRole.admin] },
      },
      select: { userId: true },
    });

    return Array.from(new Set([group.creatorId, ...adminMembers.map((m) => m.userId)]));
  }

  async getJoinRequests(groupId: number, userId: number) {
    await this.checkIsAdminOrOwner(groupId, userId);
    return this.prisma.groupJoinRequest.findMany({
      where: { groupId, status: 'pending' },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveJoinRequest(groupId: number, requestId: number, reviewerId: number) {
    await this.checkIsAdminOrOwner(groupId, reviewerId);
    const request = await this.prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.groupId !== groupId || request.status !== 'pending') {
      throw new NotFoundException('Yêu cầu tham gia không tồn tại hoặc đã được xử lý');
    }

    await this.prisma.$transaction([
      this.prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewerId,
        },
      }),
      this.prisma.groupMember.upsert({
        where: { groupId_userId: { groupId, userId: request.userId } },
        create: {
          groupId,
          userId: request.userId,
          role: GroupMemberRole.member,
          status: GroupMemberStatus.active,
        },
        update: {
          status: GroupMemberStatus.active,
        },
      }),
    ]);

    try {
      const group = await this.prisma.group.findUnique({ where: { id: groupId } });
      await this.prisma.notification.create({
        data: {
          userId: request.userId,
          senderId: reviewerId,
          type: 'group_join_approved',
          message: `Yêu cầu tham gia nhóm "${group?.name}" của bạn đã được phê duyệt!`,
          referenceId: groupId,
        },
      });
    } catch (err) {
      console.error('Error sending join approval notification:', err);
    }

    return { message: 'Đã phê duyệt thành viên thành công' };
  }

  async rejectJoinRequest(groupId: number, requestId: number, reviewerId: number) {
    await this.checkIsAdminOrOwner(groupId, reviewerId);
    const request = await this.prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.groupId !== groupId || request.status !== 'pending') {
      throw new NotFoundException('Yêu cầu tham gia không tồn tại hoặc đã được xử lý');
    }

    await this.prisma.groupJoinRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewerId,
      },
    });

    try {
      const group = await this.prisma.group.findUnique({ where: { id: groupId } });
      await this.prisma.notification.create({
        data: {
          userId: request.userId,
          senderId: reviewerId,
          type: 'group_join_rejected',
          message: `Yêu cầu tham gia nhóm "${group?.name}" của bạn đã bị từ chối.`,
          referenceId: groupId,
        },
      });
    } catch (err) {
      console.error('Error sending join rejection notification:', err);
    }

    return { message: 'Đã từ chối yêu cầu tham gia' };
  }

  async getMembers(idOrSlug: string | number, viewerId?: number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');
    const groupId = group.id;

    // Auto-unban expired bans
    await this.prisma.groupMember.updateMany({
      where: {
        groupId,
        status: GroupMemberStatus.suspended,
        bannedUntil: { lt: new Date() },
      },
      data: {
        status: GroupMemberStatus.active,
        bannedUntil: null,
      },
    });

    let isViewerAdmin = false;
    if (viewerId) {
      if (group.creatorId === viewerId) {
        isViewerAdmin = true;
      } else {
        const viewerMember = await this.prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId: viewerId } },
        });
        if (
          viewerMember &&
          viewerMember.status === GroupMemberStatus.active &&
          (viewerMember.role === GroupMemberRole.owner || viewerMember.role === GroupMemberRole.admin)
        ) {
          isViewerAdmin = true;
        }
      }
    }

    if (group.privacy === GroupPrivacy.private && !isViewerAdmin && viewerId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: viewerId } },
      });
      if (!member || member.status !== GroupMemberStatus.active) {
        throw new ForbiddenException('Chỉ thành viên mới có thể xem danh sách thành viên trong nhóm riêng tư');
      }
    }

    const statusCondition = isViewerAdmin
      ? { in: [GroupMemberStatus.active, GroupMemberStatus.suspended] }
      : GroupMemberStatus.active;

    const members = await this.prisma.groupMember.findMany({
      where: { groupId, status: statusCondition },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      userId: m.userId,
      role: m.role,
      status: m.status,
      bannedUntil: m.bannedUntil,
      joinedAt: m.joinedAt,
      user: m.user,
      isCreator: group.creatorId === m.userId,
    }));
  }

  async kickMember(groupId: number, targetUserId: number, reviewerId: number) {
    const group = await this.checkIsAdminOrOwner(groupId, reviewerId);

    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Không thể xóa người tạo nhóm');
    }
    if (targetUserId === reviewerId) {
      throw new ForbiddenException('Không thể tự kick chính mình, hãy dùng chức năng rời nhóm');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember || targetMember.status !== 'active') {
      throw new NotFoundException('Thành viên không tồn tại trong nhóm');
    }

    if (targetMember.role === GroupMemberRole.owner && reviewerId !== group.creatorId) {
      throw new ForbiddenException('Chỉ người tạo nhóm mới có thể xóa Chủ nhóm (Owner)');
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    try {
      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          senderId: reviewerId,
          type: 'group_member_kicked',
          message: `Bạn đã bị xóa khỏi nhóm "${group.name}".`,
          referenceId: group.id,
        },
      });
    } catch (err) {
      console.error('Error sending kick notification:', err);
    }

    return { message: 'Đã xóa thành viên khỏi nhóm thành công' };
  }

  async updateMemberRole(
    groupId: number,
    targetUserId: number,
    newRole: GroupMemberRole,
    reviewerId: number,
  ) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    const reviewerMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: reviewerId } },
    });

    const isCreator = group.creatorId === reviewerId;
    const isOwner = reviewerMember?.role === GroupMemberRole.owner;

    if (!isCreator && !isOwner) {
      throw new ForbiddenException('Chỉ Chủ nhóm hoặc Người tạo nhóm mới có quyền thay đổi vai trò quản trị');
    }

    if (targetUserId === reviewerId) {
      throw new ForbiddenException('Bạn không thể tự thay đổi vai trò của chính mình');
    }

    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Không thể thay đổi vai trò của người tạo nhóm');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember || targetMember.status !== 'active') {
      throw new NotFoundException('Thành viên không tồn tại trong nhóm');
    }

    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: newRole },
    });

    return {
      message: `Đã ${newRole === GroupMemberRole.admin ? 'trao quyền Quản trị viên' : 'gỡ quyền Quản trị viên'} thành công`,
    };
  }

  async banMember(
    groupId: number,
    targetUserId: number,
    durationDays: number,
    reviewerId: number,
  ) {
    const group = await this.checkIsAdminOrOwner(groupId, reviewerId);

    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Không thể ban người tạo nhóm');
    }
    if (targetUserId === reviewerId) {
      throw new ForbiddenException('Không thể tự ban chính mình');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Thành viên không tồn tại trong nhóm');
    }

    if (targetMember.role === GroupMemberRole.owner && reviewerId !== group.creatorId) {
      throw new ForbiddenException('Chỉ người tạo nhóm mới có thể ban Chủ nhóm');
    }

    if (durationDays === 0) {
      await this.prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: {
          status: GroupMemberStatus.active,
          bannedUntil: null,
        },
      });
      return { message: 'Đã gỡ cấm (unban) thành công' };
    }

    let bannedUntil: Date | null = null;
    if (durationDays > 0) {
      bannedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }

    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: {
        status: GroupMemberStatus.suspended,
        bannedUntil,
      },
    });

    const label = durationDays > 0 ? `${durationDays} ngày` : 'vĩnh viễn';
    return { message: `Đã cấm (ban) thành viên trong ${label}` };
  }

  async getGroupReports(groupId: number, userId: number) {
    await this.checkIsAdminOrOwner(groupId, userId);

    const groupPosts = await this.prisma.activityPost.findMany({
      where: { groupId },
      select: { id: true },
    });
    const postIds = groupPosts.map((p) => p.id);

    const groupMembers = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberUserIds = groupMembers.map((m) => m.userId);

    const reports = await this.prisma.report.findMany({
      where: {
        OR: [
          { targetType: 'post', targetId: { in: postIds } },
          { reportedId: { in: memberUserIds } },
        ],
        status: 'open',
      },
      include: {
        reporter: { select: { id: true, displayName: true, avatarUrl: true } },
        reported: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  }

  async resolveGroupReport(groupId: number, reportId: number, userId: number) {
    await this.checkIsAdminOrOwner(groupId, userId);
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'reviewed' },
    });
    return { message: 'Đã đánh dấu xử lý báo cáo thành công' };
  }

  async muteMember(
    groupId: number,
    targetUserId: number,
    durationDays: number,
    reviewerId: number,
  ) {
    const group = await this.checkIsAdminOrOwner(groupId, reviewerId);

    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Không thể cấm đăng bài người tạo nhóm');
    }
    if (targetUserId === reviewerId) {
      throw new ForbiddenException('Không thể tự cấm đăng bài chính mình');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Thành viên không tồn tại trong nhóm');
    }

    if (durationDays === 0) {
      await this.prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { mutedUntil: null },
      });
      return { message: 'Đã gỡ cấm đăng bài thành công' };
    }

    let mutedUntil: Date | null = null;
    if (durationDays > 0) {
      mutedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }

    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { mutedUntil },
    });

    const label = durationDays > 0 ? `${durationDays} ngày` : 'vĩnh viễn';

    try {
      const msg = durationDays > 0 
        ? `Tài khoản của bạn trong nhóm "${group.name}" đã bị cấm đăng bài trong ${durationDays} ngày.`
        : durationDays === 0
        ? `Tài khoản của bạn trong nhóm "${group.name}" đã được gỡ cấm đăng bài.`
        : `Tài khoản của bạn trong nhóm "${group.name}" đã bị cấm đăng bài vĩnh viễn.`;
      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          senderId: reviewerId,
          type: 'group_member_muted',
          message: msg,
          referenceId: group.id,
        },
      });
    } catch (err) {
      console.error('Error sending mute notification:', err);
    }

    return { message: `Đã cấm thành viên đăng bài trong ${label}` };
  }

  async toggleMemberPreApproval(
    groupId: number,
    targetUserId: number,
    isPreApproved: boolean,
    reviewerId: number,
  ) {
    await this.checkIsAdminOrOwner(groupId, reviewerId);

    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { isPreApproved },
    });

    return {
      message: `Đã ${isPreApproved ? 'bật' : 'tắt'} quyền đăng bài không cần kiểm duyệt cho thành viên`,
    };
  }

  async updateGroupSettings(idOrSlug: string | number, postApprovalRequired: boolean, userId: number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');
    await this.checkIsAdminOrOwner(group.id, userId);
    const updated = await this.prisma.group.update({
      where: { id: group.id },
      data: { postApprovalRequired },
    });
    return {
      postApprovalRequired: updated.postApprovalRequired,
      message: `Đã ${postApprovalRequired ? 'bật' : 'tắt'} chế độ kiểm duyệt bài viết`,
    };
  }

  async getPendingGroupPosts(idOrSlug: string | number, userId: number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');
    await this.checkIsAdminOrOwner(group.id, userId);
    const posts = await this.prisma.activityPost.findMany({
      where: { groupId: group.id, status: 'pending' },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts;
  }

  async approveGroupPost(idOrSlug: string | number, postId: number, userId: number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');
    await this.checkIsAdminOrOwner(group.id, userId);
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post || post.groupId !== group.id) {
      throw new NotFoundException('Bài viết không tồn tại trong nhóm');
    }
    await this.prisma.activityPost.update({
      where: { id: postId },
      data: { status: 'approved' },
    });

    try {
      await this.prisma.notification.create({
        data: {
          userId: post.userId,
          senderId: userId,
          type: 'group_post_approved',
          message: `Bài viết của bạn trong nhóm "${group.name}" đã được phê duyệt.`,
          referenceId: group.id,
        },
      });
    } catch (err) {
      console.error('Error sending post approval notification:', err);
    }

    return { message: 'Đã phê duyệt bài viết thành công' };
  }

  async rejectGroupPost(idOrSlug: string | number, postId: number, userId: number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');
    await this.checkIsAdminOrOwner(group.id, userId);
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post || post.groupId !== group.id) {
      throw new NotFoundException('Bài viết không tồn tại trong nhóm');
    }

    try {
      await this.prisma.notification.create({
        data: {
          userId: post.userId,
          senderId: userId,
          type: 'group_post_rejected',
          message: `Bài viết của bạn trong nhóm "${group.name}" đã bị từ chối.`,
          referenceId: group.id,
        },
      });
    } catch (err) {
      console.error('Error sending post rejection notification:', err);
    }

    await this.prisma.activityPost.delete({ where: { id: postId } });
    return { message: 'Đã từ chối và xóa bài viết thành công' };
  }

  async reportMember(
    groupId: number,
    reporterId: number,
    targetUserId: number,
    reason: string,
  ) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    if (reporterId === targetUserId) {
      throw new BadRequestException('Bạn không thể tự báo cáo chính mình');
    }

    const reporterMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: reporterId } },
    });
    if (!reporterMember || reporterMember.status !== 'active') {
      throw new ForbiddenException('Bạn phải là thành viên trong nhóm để báo cáo');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId: targetUserId,
        reason: reason.trim(),
        targetType: 'member',
        targetId: groupId,
      },
    });

    try {
      const adminUserIds = await this.getAdminUserIds(groupId);
      const recipientIds = adminUserIds.filter((id) => id !== reporterId);
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { displayName: true },
      });
      if (recipientIds.length > 0) {
        await this.prisma.notification.createMany({
          data: recipientIds.map((adminId) => ({
            userId: adminId,
            senderId: reporterId,
            type: 'group_member_report',
            message: `[Báo cáo Thành viên] Có báo cáo thành viên "${targetUser?.displayName || 'Thành viên'}" trong nhóm "${group.name}": "${reason.trim()}"`,
            referenceId: groupId,
          })),
        });
      }
    } catch (err) {
      console.error('Error sending member report notification:', err);
    }

    return { message: 'Đã gửi báo cáo thành viên thành công', reportId: report.id };
  }

  async deleteGroup(idOrSlug: string | number, userId: number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const group = await this.prisma.group.findUnique({
      where: isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isSystemAdmin = user?.role === 'admin';
    const isCreator = group.creatorId === userId;

    let isGroupOwner = false;
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (member && member.role === GroupMemberRole.owner && member.status === GroupMemberStatus.active) {
      isGroupOwner = true;
    }

    if (!isCreator && !isGroupOwner && !isSystemAdmin) {
      throw new ForbiddenException('Chỉ người tạo nhóm hoặc quản trị viên mới có quyền xóa nhóm');
    }

    await this.prisma.group.delete({
      where: { id: group.id },
    });

    return { message: 'Đã xóa nhóm thành công', deletedGroupId: group.id };
  }
}
