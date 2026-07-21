import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

// FS-25 — Community feed: CHỈ auto-generated post (word_public, chat_hours_milestone),
// chưa làm free-form post ở đợt này.
@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async feed(viewerId?: number) {
    const posts = await this.prisma.activityPost.findMany({
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
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
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      user: p.user,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      likedByMe: viewerId ? ((p as { likes?: unknown[] }).likes?.length ?? 0) > 0 : false,
      word:
        p.type === 'word_public' && p.contentRef
          ? (wordById.get(Number(p.contentRef)) ?? null)
          : null,
    }));
  }

  // Bài chia sẻ tự do của member (mở rộng theo yêu cầu — ngoài auto-post)
  async createPost(userId: number, content: string, imageUrl?: string) {
    const post = await this.prisma.activityPost.create({
      data: { userId, type: 'user_post', content: content.trim(), imageUrl },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    try {
      await this.notificationService.notifyFollowersNewPost(userId, post.id);
    } catch (err) {
      console.error('Failed to notify followers of new post:', err);
    }

    return post;
  }

  async updatePost(userId: number, postId: number, content?: string, imageUrl?: string, removeImage?: boolean) {
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.userId !== userId) throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết này');

    const data: any = {};
    if (content !== undefined) data.content = content.trim();
    if (removeImage) {
      data.imageUrl = null;
    } else if (imageUrl !== undefined) {
      data.imageUrl = imageUrl;
    }

    const updated = await this.prisma.activityPost.update({
      where: { id: postId },
      data,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return updated;
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.userId !== userId) throw new ForbiddenException('Bạn không có quyền xóa bài viết này');

    await this.prisma.activityPost.delete({ where: { id: postId } });
    return { success: true };
  }

  async like(userId: number, postId: number) {
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
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

  async getComments(postId: number, viewerId?: number) {
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    const comments = await this.prisma.postComment.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true } },
        ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
      user: c.user,
      likeCount: c._count.likes,
      likedByMe: viewerId ? ((c as { likes?: unknown[] }).likes?.length ?? 0) > 0 : false,
    }));
  }

  async createComment(userId: number, postId: number, content: string, parentId?: number) {
    const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    if (parentId) {
      const parentComment = await this.prisma.postComment.findUnique({ where: { id: parentId } });
      if (!parentComment) throw new NotFoundException('Không tìm thấy bình luận gốc');
    }

    const created = await this.prisma.postComment.create({
      data: { userId, postId, content: content.trim(), parentId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true } },
      },
    });

    return {
      id: created.id,
      postId: created.postId,
      userId: created.userId,
      content: created.content,
      parentId: created.parentId,
      createdAt: created.createdAt,
      user: created.user,
      likeCount: created._count.likes,
      likedByMe: false,
    };
  }

  async likeComment(userId: number, commentId: number) {
    const comment = await this.prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');
    await this.prisma.commentLike.upsert({
      where: { commentId_userId: { commentId, userId } },
      update: {},
      create: { commentId, userId },
    });
    return { liked: true };
  }

  async unlikeComment(userId: number, commentId: number) {
    await this.prisma.commentLike.deleteMany({ where: { commentId, userId } });
    return { liked: false };
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    if (comment.userId !== userId && comment.post.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.prisma.postComment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
