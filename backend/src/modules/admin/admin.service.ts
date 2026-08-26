import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LanguageRole,
  ModerationActionType,
  Prisma,
  ReportStatus,
  UserRole,
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
        reported: {
          select: { id: true, displayName: true, email: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dashboard Stats cho Admin
  async getDashboardStats() {
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [
      totalUsers,
      usersThisWeek,
      openReportsCount,
      newUsersThisMonth,
      activeConversationsToday,
      recentReports,
      recentUsers,
      learningLanguagesGroup,
      nativeLanguagesGroup,
      countriesGroup,
      allLanguages,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { not: UserRole.admin } } }),
      this.prisma.user.count({
        where: { role: { not: UserRole.admin }, createdAt: { gte: startOfWeek } },
      }),
      this.prisma.report.count({ where: { status: ReportStatus.open } }),
      this.prisma.user.count({
        where: { role: { not: UserRole.admin }, createdAt: { gte: startOfMonth } },
      }),
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
          reported: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { role: { not: UserRole.admin } },
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
      this.prisma.userLanguage.groupBy({
        by: ['languageId'],
        where: { role: LanguageRole.learning },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 6,
      }),
      this.prisma.userLanguage.groupBy({
        by: ['languageId'],
        where: { role: LanguageRole.native },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 6,
      }),
      this.prisma.user.groupBy({
        by: ['country'],
        where: { country: { not: null }, role: { not: UserRole.admin } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
      this.prisma.language.findMany(),
    ]);

    const previousUsers = totalUsers - usersThisWeek;
    const userGrowthWeeklyPercent =
      previousUsers > 0 ? (usersThisWeek / previousUsers) * 100 : 0;

    const langMap = new Map(allLanguages.map((l) => [l.id, l.name]));

    const totalLearningCount = learningLanguagesGroup.reduce(
      (sum, item) => sum + item._count.userId,
      0,
    );
    const learningLanguages = learningLanguagesGroup.map((item) => {
      const count = item._count.userId;
      return {
        name: langMap.get(item.languageId) || `Ngôn ngữ #${item.languageId}`,
        count,
        percentage:
          totalLearningCount > 0
            ? Number(((count / totalLearningCount) * 100).toFixed(1))
            : 0,
      };
    });

    const totalNativeCount = nativeLanguagesGroup.reduce(
      (sum, item) => sum + item._count.userId,
      0,
    );
    const userOrigins = nativeLanguagesGroup.map((item) => {
      const count = item._count.userId;
      return {
        name: langMap.get(item.languageId) || `Ngôn ngữ #${item.languageId}`,
        count,
        percentage:
          totalNativeCount > 0
            ? Number(((count / totalNativeCount) * 100).toFixed(1))
            : 0,
      };
    });

    return {
      totalUsers,
      userGrowthWeeklyPercent: Number(userGrowthWeeklyPercent.toFixed(1)),
      openReportsCount,
      newUsersThisMonth,
      activeConversationsToday,
      recentReports,
      recentUsers,
      demographics: {
        userOrigins,
        learningLanguages,
      },
    };
  }

  // Quản lý danh sách Người dùng (phân trang + tìm kiếm, không bao gồm tài khoản Admin)
  async getUsers(page = 1, limit = 10, search?: string, status?: UserStatus) {
    const where: Prisma.UserWhereInput = {
      role: { not: UserRole.admin },
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
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });
  }

  // US-20 — vô hiệu hóa theo mức độ / xóa cứng khi tái phạm + ghi log kiểm duyệt
  async moderate(adminId: number, targetUserId: number, dto: ModerateDto) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target)
      throw new NotFoundException(
        this.i18n.t('translation.admin.userNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );

    if (target.role === UserRole.admin) {
      throw new BadRequestException(
        'Không thể thực hiện kiểm duyệt hoặc xử lý tài khoản Quản trị viên (Admin).',
      );
    }

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
        ? [
            this.prisma.user.update({
              where: { id: targetUserId },
              data: userUpdate,
            }),
          ]
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
        intent: true,
        gender: true,
        dob: true,
        city: true,
        country: true,
        timezone: true,
        availableSlots: true,
        role: true,
        status: true,
        suspendedUntil: true,
        lastActive: true,
        createdAt: true,
        languages: {
          select: {
            id: true,
            role: true,
            level: true,
            language: {
              select: {
                id: true,
                code: true,
                name: true,
                framework: true,
              },
            },
          },
        },
        interests: {
          select: {
            id: true,
            topic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        matchPreference: {
          select: {
            intent: true,
            languageFocus: true,
            levelDesired: true,
          },
        },
        _count: {
          select: {
            reportsReceived: true,
            reportsSent: true,
            savedWords: true,
            vocabWords: true,
            matchesAsMember: true,
            matchesAsCandidate: true,
          },
        },
      },
    });
    if (!user)
      throw new NotFoundException(
        this.i18n.t('translation.admin.userNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );
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

  async deleteLanguage(id: number) {
    const questionSetCount = await this.prisma.questionSet.count({
      where: { languageId: id },
    });
    if (questionSetCount > 0) {
      throw new BadRequestException(
        'Không thể xóa ngôn ngữ đang có Bộ đề trắc nghiệm. Vui lòng chọn Ẩn ngôn ngữ.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.userSavedWord.deleteMany({
        where: { word: { languageId: id } },
      }),
      this.prisma.wordLibrary.deleteMany({ where: { languageId: id } }),
      this.prisma.userLanguage.deleteMany({ where: { languageId: id } }),
      this.prisma.group.deleteMany({ where: { languageId: id } }),
      this.prisma.language.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  createTopic(dto: CreateTopicDto) {
    return this.prisma.topic.create({ data: dto });
  }

  updateTopic(id: number, dto: UpdateTopicDto) {
    return this.prisma.topic.update({ where: { id }, data: dto });
  }

  async deleteTopic(id: number) {
    const questionSetCount = await this.prisma.questionSet.count({
      where: { topicId: id },
    });
    if (questionSetCount > 0) {
      throw new BadRequestException(
        'Không thể xóa chủ đề đang được dùng trong Bộ đề trắc nghiệm. Vui lòng chọn Ẩn chủ đề.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { topicId: id } }),
      this.prisma.group.deleteMany({ where: { topicId: id } }),
      this.prisma.topic.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  private buildUserUpdate(
    action: ModerationActionType,
  ): Prisma.UserUpdateInput | null {
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

  // Quản lý từ vựng đã lưu của người dùng
  async getSavedWords(
    page = 1,
    limit = 10,
    search?: string,
    languageId?: number,
  ) {
    const where: Prisma.WordLibraryWhereInput = {
      ...(languageId ? { languageId } : {}),
      ...(search
        ? {
            OR: [
              { term: { contains: search, mode: 'insensitive' } },
              { definition: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.wordLibrary.findMany({
        where,
        include: {
          language: { select: { id: true, code: true, name: true } },
          savedBy: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.wordLibrary.count({ where }),
    ]);

    return {
      items: items.map((w) => ({
        id: w.id,
        term: w.term,
        language: w.language,
        definition: w.definition,
        partOfSpeech: w.partOfSpeech,
        phonetic: w.phonetic,
        example: w.example,
        saveCount: w.saveCount,
        isPublic: w.isPublic,
        createdAt: w.createdAt,
        savedBy: w.savedBy.map((s) => ({
          user: s.user,
          createdAt: s.createdAt,
          source: s.source,
          personalNote: s.personalNote,
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteWord(id: number) {
    await this.prisma.$transaction([
      this.prisma.userSavedWord.deleteMany({ where: { wordLibraryId: id } }),
      this.prisma.wordLibrary.delete({ where: { id } }),
    ]);
    return { success: true };
  }
}
