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
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { scoreAndRankCandidates } from './utils/matching-score.calculator';
import { EntitlementsService } from '../entitlements/entitlements.service';
import {
  AdvancedFilter,
  applyAdvancedFilter,
  hasAdvancedFilter,
} from './utils/advanced-filter.util';

const TEACH_ROLES: LanguageRole[] = [LanguageRole.native, LanguageRole.fluent];

// FS-08 (SRS v3.0): luôn cố trả về 6–10 gợi ý
export const SUGGESTIONS_MIN = 6;
export const SUGGESTIONS_PAGE_SIZE = 10;

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // FS-08 — gợi ý bù trừ ngôn ngữ, MATCH_SCORE tính on-the-fly (không cache).
  // Nếu <6 kết quả thì nới dần: (1) bỏ lọc topic chung → (2) nới level mong muốn
  // → (3) bỏ ưu tiên last_active. Điều kiện bù trừ learning↔native|fluent KHÔNG nới.
  async getSuggestions(
    userId: number,
    filter?: { languageId?: number; offset?: number; advanced?: AdvancedFilter },
  ) {
    // EP-11 — bộ lọc nâng cao là hạng mục Pro (SRS §3.2). Không có quyền thì
    // chặn đúng bộ lọc, KHÔNG cắt bớt danh sách gợi ý (BR-46).
    if (hasAdvancedFilter(filter?.advanced)) {
      await this.entitlements.assertAndConsume(userId, 'match.advanced_filter');
    }
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
        city: true,
        timezone: true,
        languages: { include: { language: true } },
        interests: { include: { topic: true } },
      },
      take: 200,
    });

    const likedMap = await this.getLikedMap(userId);
    const ranked = scoreAndRankCandidates(me, candidates, likedMap);

    // Lọc SAU khi đã xếp hạng: thứ tự và thành phần gợi ý không đổi giữa hai gói.
    const picked = applyAdvancedFilter(ranked, filter?.advanced);

    const insufficientPool = picked.length < SUGGESTIONS_MIN;
    const offset = Math.max(0, filter?.offset ?? 0);
    return {
      items: picked.slice(offset, offset + SUGGESTIONS_PAGE_SIZE),
      total: picked.length,
      unfilteredTotal: ranked.length,
      insufficientPool,
    };
  }

  // Tab "Tất cả thành viên" — mọi user active (không cần bù trừ), kèm trạng thái đã thích
  async getAllMembers(userId: number, offset = 0) {
    const excludedIds = await this.getBlockedUserIds(userId);

    const where: Prisma.UserWhereInput = {
      id: { notIn: [userId, ...excludedIds] },
      status: UserStatus.active,
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

    // BR-45 — hạn mức Like áp dụng cho MỌI tài khoản kể cả Pro. Hạn mức này
    // sinh ra để chống spam sau khi bỏ điều kiện mutual match (SRS §3.4);
    // việc nó đồng thời là ranh giới gói chỉ là hệ quả.
    await this.entitlements.assertAndConsume(userId, 'match.like');

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

    // Mình đã thích trước đó → idempotent
    if (existing.memberId === userId) {
      return {
        match: existing,
        conversation,
        mutual: existing.status === MatchStatus.mutual,
      };
    }

    // Đối phương thích trước, giờ mình thích lại → mutual (US-13)
    const match =
      existing.status === MatchStatus.mutual
        ? existing
        : await this.prisma.match.update({
            where: { id: existing.id },
            data: { status: MatchStatus.mutual },
          });
    await this.prisma.interaction.create({
      data: { matchId: existing.id, userId, action: InteractionAction.like },
    });
    return { match, conversation, mutual: true };
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
