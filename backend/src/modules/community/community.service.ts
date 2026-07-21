import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';

// FS-25 — Community feed: CHỈ auto-generated post (word_public, chat_hours_milestone),
// chưa làm free-form post ở đợt này.
@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async feed(viewerId?: number) {
    const posts = await this.prisma.activityPost.findMany({
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true } },
        ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Post loại word_public tham chiếu WORD_LIBRARY qua contentRef — join thủ công theo batch
    const wordIds = posts
      .filter((p) => p.type === 'word_public' && p.contentRef)
      .map((p) => Number(p.contentRef));
    const words = wordIds.length
      ? await this.prisma.wordLibrary.findMany({
          where: { id: { in: wordIds } },
          include: { language: true },
        })
      : [];
    const wordById = new Map(words.map((w) => [w.id, w]));

    return posts.map((p) => ({
      id: p.id,
      type: p.type,
      contentRef: p.contentRef,
      content: p.content,
      createdAt: p.createdAt,
      user: p.user,
      likeCount: p._count.likes,
      likedByMe: viewerId ? ((p as { likes?: unknown[] }).likes?.length ?? 0) > 0 : false,
      word:
        p.type === 'word_public' && p.contentRef
          ? (wordById.get(Number(p.contentRef)) ?? null)
          : null,
    }));
  }

  // Bài chia sẻ tự do của member (mở rộng theo yêu cầu — ngoài auto-post)
  createPost(userId: number, content: string) {
    return this.prisma.activityPost.create({
      data: { userId, type: 'user_post', content: content.trim() },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true } },
      },
    });
  }

  async like(userId: number, postId: number) {
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(this.i18n.t('translation.community.postNotFound', { lang: I18nContext.current()?.lang }));
    await this.prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });
    return { liked: true };
  }

  async unlike(userId: number, postId: number) {
    await this.prisma.postLike.deleteMany({ where: { postId, userId } });
    return { liked: false };
  }
}
