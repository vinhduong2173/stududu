import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InteractionAction,
  LanguageRole,
  MatchStatus,
  Prisma,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';

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
    if (!me) throw new NotFoundException(this.i18n.t('translation.user.notFound', { lang: I18nContext.current()?.lang }));

    const myLearning = me.languages
      .filter((l) => l.role === LanguageRole.learning)
      .map((l) => l.languageId);
    const myTeach = me.languages
      .filter((l) => TEACH_ROLES.includes(l.role))
      .map((l) => l.languageId);

    // AC (US-04 AC3): cần ≥1 ngôn ngữ dạy được và ≥1 đang học
    if (myLearning.length === 0 || myTeach.length === 0) {
      throw new BadRequestException(
        this.i18n.t('translation.matching.mustCompleteProfile', { lang: I18nContext.current()?.lang }),
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
              languageId: { in: filter?.languageId ? [filter.languageId] : myLearning },
            },
          },
        },
        { languages: { some: { role: LanguageRole.learning, languageId: { in: myTeach } } } },
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
        languages: { include: { language: true } },
        interests: { include: { topic: true } },
      },
      take: 200,
    });

    const myTopicIds = new Set(me.interests.map((i) => i.topicId));
    const likedMap = await this.getLikedMap(userId);

    // MATCH_SCORE = lang_complement (chính) + shared_topic_count (phụ) + intent_alignment (cộng)
    const scored = candidates.map((c) => {
      const sharedTopicCount = c.interests.filter((i) => myTopicIds.has(i.topicId)).length;
      const intentAlignment = Boolean(me.intent && c.intent && me.intent === c.intent);
      const total = 10 + sharedTopicCount + (intentAlignment ? 1 : 0);
      const likedInfo = likedMap.get(c.id);
      return {
        user: c,
        score: { langComplement: true, sharedTopicCount, intentAlignment, total },
        liked: Boolean(likedInfo),
        conversationId: likedInfo?.conversationId ?? null,
        // why-matched (US-10 AC2)
        whyMatched: {
          sharedTopics: c.interests
            .filter((i) => myTopicIds.has(i.topicId))
            .map((i) => i.topic.name),
        },
      };
    });

    type Scored = (typeof scored)[number];

    // Bậc nới lỏng — dừng ngay khi gom đủ SUGGESTIONS_MIN
    const levelDesired = me.matchPreference?.levelDesired ?? null;
    const matchesLevel = (c: Scored) =>
      !levelDesired ||
      c.user.languages.some(
        (l) => l.role === LanguageRole.learning && l.level === levelDesired,
      );
    const tiers: ((c: Scored) => boolean)[] = [
      (c) => c.score.sharedTopicCount > 0 && matchesLevel(c), // chặt: topic chung + đúng level
      (c) => matchesLevel(c), // (1) bỏ lọc topic chung
      () => true, // (2) nới level mong muốn
    ];

    const picked: Scored[] = [];
    const pickedIds = new Set<number>();
    for (const tier of tiers) {
      for (const c of scored) {
        if (pickedIds.has(c.user.id) || !tier(c)) continue;
        picked.push(c);
        pickedIds.add(c.user.id);
      }
      if (picked.length >= SUGGESTIONS_MIN) break;
    }

    // (3) bậc cuối: nếu vẫn thiếu thì bỏ ưu tiên sắp xếp theo last_active
    const dropLastActiveOrdering = picked.length < SUGGESTIONS_MIN;
    picked.sort((a, b) => {
      const byScore = b.score.total - a.score.total;
      if (byScore !== 0 || dropLastActiveOrdering) return byScore;
      return (b.user.lastActive?.getTime() ?? 0) - (a.user.lastActive?.getTime() ?? 0);
    });

    // Pool quá nhỏ → FE hiển thị "chưa đủ đối tác phù hợp, quay lại sau" thay vì empty state
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
    if (userId === targetId) throw new BadRequestException(this.i18n.t('translation.matching.noSelfLike', { lang: I18nContext.current()?.lang }));

    const target = await this.prisma.user.findUnique({
      where: { id: targetId, status: UserStatus.active },
    });
    if (!target) throw new NotFoundException(this.i18n.t('translation.matching.userNotFound', { lang: I18nContext.current()?.lang }));

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
        data: { memberId: userId, candidateId: targetId, status: MatchStatus.liked },
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
      (await this.prisma.conversation.create({ data: { matchId: existing.id } }));

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
    return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
  }

  /** Map targetUserId → { conversationId } cho những người mình ĐÃ thích */
  private async getLikedMap(userId: number): Promise<Map<number, { conversationId: number | null }>> {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { memberId: userId, status: { in: [MatchStatus.liked, MatchStatus.mutual] } },
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
    return { liked: Boolean(info), conversationId: info?.conversationId ?? null };
  }
}
