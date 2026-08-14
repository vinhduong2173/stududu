import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { GroupMemberRole } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

  async feed(viewerId?: number, targetUserId?: number) {
    const whereCondition: any = { groupId: null };
    if (targetUserId && !isNaN(targetUserId)) {
      whereCondition.userId = targetUserId;
    }

    const posts = await this.prisma.activityPost.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        ...(viewerId
          ? { likes: { where: { userId: viewerId }, select: { id: true } } }
          : {}),
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
      commentCount: (p._count as any).comments ?? 0,
      likedByMe: viewerId
        ? ((p as { likes?: unknown[] }).likes?.length ?? 0) > 0
        : false,
      word:
        p.type === 'word_public' && p.contentRef
          ? (wordById.get(Number(p.contentRef)) ?? null)
          : null,
    }));
  }

  // Bài chia sẻ tự do của member
  createPost(userId: number, content: string, imageUrl?: string) {
    return this.prisma.activityPost.create({
      data: {
        userId,
        type: 'user_post',
        content: content.trim(),
        imageUrl: imageUrl || null,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async updatePost(
    userId: number,
    postId: number,
    dto: { content?: string; imageUrl?: string; removeImage?: boolean },
  ) {
    const post = await this.prisma.activityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    if (post.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết này');

    const data: any = {};
    if (dto.content !== undefined) data.content = dto.content.trim();
    if (dto.removeImage) {
      data.imageUrl = null;
    } else if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl;
    }

    return this.prisma.activityPost.update({
      where: { id: postId },
      data,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.prisma.activityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    let canDelete = post.userId === userId;

    if (!canDelete && post.groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: post.groupId } });
      if (group) {
        if (group.creatorId === userId) {
          canDelete = true;
        } else {
          const member = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: post.groupId, userId } },
          });
          if (
            member &&
            member.status === 'active' &&
            (member.role === GroupMemberRole.owner || member.role === GroupMemberRole.admin)
          ) {
            canDelete = true;
          }
        }
      }
    }

    if (!canDelete) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
    }

    await this.prisma.activityPost.delete({ where: { id: postId } });
    return { success: true };
  }

  async like(userId: number, postId: number) {
    const post = await this.prisma.activityPost.findUnique({
      where: { id: postId },
    });
    if (!post)
      throw new NotFoundException(
        this.i18n.t('translation.community.postNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );
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

  // --- COMMENTS ---
  async getComments(postId: number, viewerId?: number) {
    const comments = await (this.prisma as any).postComment.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true } },
        ...(viewerId
          ? { likes: { where: { userId: viewerId }, select: { id: true } } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c: any) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
      user: c.user,
      likeCount: c._count?.likes ?? 0,
      likedByMe: viewerId ? (c.likes?.length ?? 0) > 0 : false,
    }));
  }

  async addComment(
    userId: number,
    postId: number,
    dto: { content: string; parentId?: number },
  ) {
    const post = await this.prisma.activityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    if (dto.parentId) {
      const parent = await (this.prisma as any).postComment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('Bình luận gốc không tồn tại');
    }

    const created = await (this.prisma as any).postComment.create({
      data: {
        postId,
        userId,
        content: dto.content.trim(),
        parentId: dto.parentId || null,
      },
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
      likeCount: created._count?.likes ?? 0,
      likedByMe: false,
    };
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await (this.prisma as any).postComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');
    if (comment.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');

    await (this.prisma as any).postComment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async likeComment(userId: number, commentId: number) {
    const comment = await (this.prisma as any).postComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    await (this.prisma as any).commentLike.upsert({
      where: { commentId_userId: { commentId, userId } },
      update: {},
      create: { commentId, userId },
    });
    return { liked: true };
  }

  async unlikeComment(userId: number, commentId: number) {
    await (this.prisma as any).commentLike.deleteMany({
      where: { commentId, userId },
    });
    return { liked: false };
  }
}
