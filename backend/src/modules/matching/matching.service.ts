import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InteractionAction,
  LanguageRole,
  MatchStatus,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { scoreAndRankCandidates } from './utils/matching-score.calculator';

const TEACH_ROLES: LanguageRole[] = [LanguageRole.native, LanguageRole.fluent];

// FS-08 (SRS v3.0): luôn cố trả về 6–10 gợi ý
export const SUGGESTIONS_MIN = 6;
export const SUGGESTIONS_PAGE_SIZE = 10;

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  // FS-08 — gợi ý bù trừ ngôn ngữ, MATCH_SCORE tính on-the-fly (không cache).
  // Nếu <6 kết quả thì nới dần: (1) bỏ lọc topic chung → (2) nới level mong muốn
  // → (3) bỏ ưu tiên last_active. Điều kiện bù trừ learning↔native|fluent KHÔNG nới.
  async getSuggestions(
    userId: number,
    filter?: { languageId?: number; offset?: number },
  ) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { languages: true, interests: true, matchPreference: true },
    });
    if (!me)
      throw new NotFoundException(
        this.i18n.t('translation.user.notFound', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const myLearning = me.languages
      .filter((l) => l.role === LanguageRole.learning)
      .map((l) => l.languageId);
    const myTeach = me.languages
      .filter((l) => TEACH_ROLES.includes(l.role))
      .map((l) => l.languageId);

    // AC (US-04 AC3): cần ≥1 ngôn ngữ dạy được và ≥1 đang học
    if (myLearning.length === 0 || myTeach.length === 0) {
      throw new BadRequestException(
        this.i18n.t('translation.matching.mustCompleteProfile', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Người đã thích vẫn hiển thị (nút chuyển "Đã thích") — chỉ loại người bị block
    const excludedIds = await this.getBlockedUserIds(userId);

    // Điều kiện bù trừ (BẤT BIẾN — không nới): họ dạy được cái tôi học VÀ họ học cái tôi dạy
    const where: Prisma.UserWhereInput = {
      id: { notIn: [userId, ...excludedIds] },
      status: UserStatus.active,
      role: { not: UserRole.admin },
      AND: [
        {
          languages: {
            some: {
              role: { in: TEACH_ROLES },
              languageId: {
                in: filter?.languageId ? [filter.languageId] : myLearning,
              },
            },
          },
        },
        {
          languages: {
            some: { role: LanguageRole.learning, languageId: { in: myTeach } },
          },
        },
      ],
    };

    const candidates = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        intent: true,
        lastActive: true,
        dob: true,
        gender: true,
        country: true,
        city: true,
        languages: { include: { language: true } },
        interests: { include: { topic: true } },
      },
      take: 200,
    });

    const likedMap = await this.getLikedMap(userId);
    const picked = scoreAndRankCandidates(me, candidates, likedMap);

    const insufficientPool = picked.length < SUGGESTIONS_MIN;
    const offset = Math.max(0, filter?.offset ?? 0);
    return {
      items: picked.slice(offset, offset + SUGGESTIONS_PAGE_SIZE),
      total: picked.length,
      insufficientPool,
    };
  }

  // Tab "Tất cả thành viên" — mọi user active (không cần bù trừ), kèm trạng thái đã thích
  async getAllMembers(userId: number, offset = 0) {
    const excludedIds = await this.getBlockedUserIds(userId);

    const where: Prisma.UserWhereInput = {
      id: { notIn: [userId, ...excludedIds] },
      status: UserStatus.active,
      role: { not: UserRole.admin },
    };

    const [members, total, likedMap] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          intent: true,
          lastActive: true,
          dob: true,
          gender: true,
          country: true,
          city: true,
          languages: { include: { language: true } },
          interests: { include: { topic: true } },
        },
        orderBy: { lastActive: { sort: 'desc', nulls: 'last' } },
        skip: Math.max(0, offset),
        take: SUGGESTIONS_PAGE_SIZE,
      }),
      this.prisma.user.count({ where }),
      this.getLikedMap(userId),
    ]);

    return {
      items: members.map((user) => {
        const likedInfo = likedMap.get(user.id);
        return {
          user,
          liked: Boolean(likedInfo),
          conversationId: likedInfo?.conversationId ?? null,
        };
      }),
      total,
    };
  }

  // Logic mới (đã chốt lại): chỉ cần 1 người thích là mở CONVERSATION ngay,
  // không chờ mutual; nếu 2 bên cùng thích thì match chuyển mutual.
  async like(userId: number, targetId: number) {
    if (userId === targetId)
      throw new BadRequestException(
        this.i18n.t('translation.matching.noSelfLike', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const target = await this.prisma.user.findUnique({
      where: { id: targetId, status: UserStatus.active },
    });
    if (!target)
      throw new NotFoundException(
        this.i18n.t('translation.matching.userNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );

    // Đã có match theo chiều nào chưa (mình→họ hoặc họ→mình)?
    const existing = await this.prisma.match.findFirst({
      where: {
        OR: [
          { memberId: userId, candidateId: targetId },
          { memberId: targetId, candidateId: userId },
        ],
      },
      include: { conversation: { select: { id: true } } },
    });

    // Chưa ai thích ai → tạo match + mở hội thoại ngay
    if (!existing) {
      const match = await this.prisma.match.create({
        data: {
          memberId: userId,
          candidateId: targetId,
          status: MatchStatus.liked,
        },
      });
      const [conversation] = await this.prisma.$transaction([
        this.prisma.conversation.create({ data: { matchId: match.id } }),
        this.prisma.interaction.create({
          data: { matchId: match.id, userId, action: InteractionAction.like },
        }),
      ]);
      return { match, conversation, mutual: false };
    }

    const conversation =
      existing.conversation ??
      (await this.prisma.conversation.create({
        data: { matchId: existing.id },
      }));

    // Mình là người tạo match trước đó
    if (existing.memberId === userId) {
      if (
        existing.status !== MatchStatus.liked &&
        existing.status !== MatchStatus.mutual
      ) {
        const match = await this.prisma.match.update({
          where: { id: existing.id },
          data: { status: MatchStatus.liked },
        });
        await this.prisma.interaction.create({
          data: { matchId: existing.id, userId, action: InteractionAction.like },
        });
        return { match, conversation, mutual: false };
      }
      return {
        match: existing,
        conversation,
        mutual: existing.status === MatchStatus.mutual,
      };
    }

    // Đối phương là người tạo match:
    // Nếu đối phương đang thích mình -> chuyển thành mutual (US-13)
    if (existing.status === MatchStatus.liked) {
      const match = await this.prisma.match.update({
        where: { id: existing.id },
        data: { status: MatchStatus.mutual },
      });
      await this.prisma.interaction.create({
        data: { matchId: existing.id, userId, action: InteractionAction.like },
      });
      return { match, conversation, mutual: true };
    }

    // Nếu đối phương đã từng bỏ thích -> mình thích lại thì đảo người tạo match thành mình
    const match = await this.prisma.match.update({
      where: { id: existing.id },
      data: {
        memberId: userId,
        candidateId: targetId,
        status: MatchStatus.liked,
      },
    });
    await this.prisma.interaction.create({
      data: { matchId: existing.id, userId, action: InteractionAction.like },
    });
    return { match, conversation, mutual: false };
  }

  // Unlike — hủy thích một người đã thích trước đó (bảo lưu toàn bộ tin nhắn & hội thoại)
  async unlike(userId: number, targetId: number) {
    if (userId === targetId) {
      throw new BadRequestException(
        this.i18n.t('translation.matching.noSelfLike', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { memberId: userId, candidateId: targetId },
          { memberId: targetId, candidateId: userId },
        ],
      },
      include: {
        conversation: true,
      },
    });

    if (!match) {
      return { unliked: false };
    }

    // TH 1: Match đang ở trạng thái mutual (cả 2 bên cùng thích nhau)
    if (match.status === MatchStatus.mutual) {
      await this.prisma.interaction.deleteMany({
        where: { matchId: match.id, userId },
      });

      // TargetId vẫn thích userId, nên chuyển match về trạng thái liked 1 chiều do targetId khởi xướng
      await this.prisma.match.update({
        where: { id: match.id },
        data: {
          memberId: targetId,
          candidateId: userId,
          status: MatchStatus.liked,
        },
      });

      return { unliked: true, mutual: false };
    }

    // TH 2: Match 1 chiều do chính userId thích targetId
    if (match.memberId === userId && match.status === MatchStatus.liked) {
      await this.prisma.interaction.deleteMany({
        where: { matchId: match.id, userId },
      });

      // Cập nhật trạng thái thành skipped để hủy like nhưng vẫn giữ nguyên Conversation & Messages
      await this.prisma.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.skipped },
      });

      return { unliked: true };
    }

    return { unliked: false };
  }

  // Loại khỏi gợi ý: chỉ những người đã block nhau (skip đã bỏ khỏi sản phẩm)
  private async getBlockedUserIds(userId: number): Promise<number[]> {
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    return blocks.map((b) =>
      b.blockerId === userId ? b.blockedId : b.blockerId,
    );
  }

  /** Map targetUserId → { conversationId } cho những người mình ĐÃ thích */
  private async getLikedMap(
    userId: number,
  ): Promise<Map<number, { conversationId: number | null }>> {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          {
            memberId: userId,
            status: { in: [MatchStatus.liked, MatchStatus.mutual] },
          },
          { candidateId: userId, status: MatchStatus.mutual },
        ],
      },
      include: { conversation: { select: { id: true } } },
    });

    const map = new Map<number, { conversationId: number | null }>();
    for (const m of matches) {
      const otherId = m.memberId === userId ? m.candidateId : m.memberId;
      map.set(otherId, { conversationId: m.conversation?.id ?? null });
    }
    return map;
  }

  /** Trạng thái quan hệ của viewer với 1 hồ sơ (trang hồ sơ đối tác) */
  async getRelation(viewerId: number, targetId: number) {
    const likedMap = await this.getLikedMap(viewerId);
    const info = likedMap.get(targetId);
    return {
      liked: Boolean(info),
      conversationId: info?.conversationId ?? null,
    };
  }
}
