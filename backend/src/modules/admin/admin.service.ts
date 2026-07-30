import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ModerationActionType,
  Prisma,
  ReportStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateLanguageDto,
  CreateTopicDto,
  UpdateLanguageDto,
  UpdateTopicDto,
} from './dto/catalog.dto';
import { ModerateDto } from './dto/moderate.dto';
import { I18nService, I18nContext } from 'nestjs-i18n';

const SUSPEND_DURATIONS: Partial<Record<ModerationActionType, number>> = {
  [ModerationActionType.suspend_3d]: 3 * 24 * 60 * 60 * 1000,
  [ModerationActionType.suspend_1w]: 7 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  // US-19 AC1 — danh sách report kèm người báo / bị báo
  getReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: { select: { id: true, displayName: true, email: true } },
        reported: { select: { id: true, displayName: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dashboard Stats cho Admin
  async getDashboardStats() {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      usersThisWeek,
      openReportsCount,
      newUsersThisMonth,
      activeConversationsToday,
      recentReports,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.report.count({ where: { status: ReportStatus.open } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.message
        .groupBy({
          by: ['conversationId'],
          where: { sentAt: { gte: startOfToday } },
        })
        .then((res) => res.length),
      this.prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, displayName: true, email: true } },
          reported: { select: { id: true, displayName: true, email: true, avatarUrl: true, status: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
    ]);

    const previousUsers = totalUsers - usersThisWeek;
    const userGrowthWeeklyPercent = previousUsers > 0 ? (usersThisWeek / previousUsers) * 100 : 0;

    return {
      totalUsers,
      userGrowthWeeklyPercent: Number(userGrowthWeeklyPercent.toFixed(1)),
      openReportsCount,
      newUsersThisMonth,
      activeConversationsToday,
      recentReports,
      recentUsers,
    };
  }

  // Quản lý danh sách Người dùng (phân trang + tìm kiếm)
  async getUsers(page = 1, limit = 10, search?: string, status?: UserStatus) {
    const where: Prisma.UserWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { reportsReceived: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  updateReportStatus(reportId: number, status: ReportStatus) {
    return this.prisma.report.update({ where: { id: reportId }, data: { status } });
  }

  // US-20 — vô hiệu hóa theo mức độ / xóa cứng khi tái phạm + ghi log kiểm duyệt
  async moderate(adminId: number, targetUserId: number, dto: ModerateDto) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException(this.i18n.t('translation.admin.userNotFound', { lang: I18nContext.current()?.lang }));

    const userUpdate = this.buildUserUpdate(dto.action);

    const [action] = await this.prisma.$transaction([
      this.prisma.moderationAction.create({
        data: { adminId, targetUserId, action: dto.action, reason: dto.reason },
      }),
      // US-19 AC2 — đã ra quyết định thì các report đang mở về người này coi như xử lý xong
      this.prisma.report.updateMany({
        where: { reportedId: targetUserId, status: ReportStatus.open },
        data: { status: ReportStatus.reviewed },
      }),
      ...(userUpdate
        ? [this.prisma.user.update({ where: { id: targetUserId }, data: userUpdate })]
        : []),
    ]);

    return action;
  }

  // Lịch sử vi phạm — căn cứ xác định "tái phạm" (leo thang: 3d → 1w → xóa cứng)
  getViolationHistory(targetUserId: number) {
    return this.prisma.moderationAction.findMany({
      where: { targetUserId },
      include: { admin: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // MÀN 15 — chi tiết người dùng để admin ra quyết định
  async getUserDetail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        suspendedUntil: true,
        lastActive: true,
        createdAt: true,
        _count: { select: { reportsReceived: true, reportsSent: true } },
      },
    });
    if (!user) throw new NotFoundException(this.i18n.t('translation.admin.userNotFound', { lang: I18nContext.current()?.lang }));
    return user;
  }

  // US-21 — quản lý danh mục LANGUAGE & TOPIC (admin thấy cả mục đã ẩn)
  getAllLanguages() {
    return this.prisma.language.findMany({ orderBy: { name: 'asc' } });
  }

  getAllTopics() {
    return this.prisma.topic.findMany({ orderBy: { name: 'asc' } });
  }

  createLanguage(dto: CreateLanguageDto) {
    return this.prisma.language.create({ data: dto });
  }

  updateLanguage(id: number, dto: UpdateLanguageDto) {
    return this.prisma.language.update({ where: { id }, data: dto });
  }

  createTopic(dto: CreateTopicDto) {
    return this.prisma.topic.create({ data: dto });
  }

  updateTopic(id: number, dto: UpdateTopicDto) {
    return this.prisma.topic.update({ where: { id }, data: dto });
  }

  private buildUserUpdate(action: ModerationActionType): Prisma.UserUpdateInput | null {
    const suspendMs = SUSPEND_DURATIONS[action];
    if (suspendMs) {
      return {
        status: UserStatus.suspended,
        suspendedUntil: new Date(Date.now() + suspendMs),
      };
    }
    if (action === ModerationActionType.hard_delete) {
      // Đã chốt: ẩn danh dữ liệu, không xóa bản ghi — giữ toàn vẹn hội thoại của người còn lại
      return {
        status: UserStatus.deleted,
        displayName: 'Người dùng đã xóa',
        bio: null,
        avatarUrl: null,
        suspendedUntil: null,
      };
    }
    return null; // warn: chỉ ghi log
  }
}
