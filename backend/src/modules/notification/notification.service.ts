import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async notifyFollowersNewPost(posterId: number, postId: number) {
    const poster = await this.prisma.user.findUnique({
      where: { id: posterId },
      select: { displayName: true },
    });
    if (!poster) return;

    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { candidateId: posterId, status: { in: ['liked', 'mutual'] } },
          { memberId: posterId, status: 'mutual' },
        ],
      },
      select: {
        memberId: true,
        candidateId: true,
      },
    });

    const followerIds = matches.map((m) => m.memberId === posterId ? m.candidateId : m.memberId);
    const uniqueFollowerIds = Array.from(new Set(followerIds));

    await Promise.all(
      uniqueFollowerIds.map((followerId) =>
        this.createNotification(
          followerId,
          posterId,
          'new_post',
          `${poster.displayName} đã đăng tải một bài viết mới.`,
          postId,
        ),
      ),
    );
  }

  async createNotification(
    userId: number,
    senderId: number | null,
    type: string,
    message: string,
    referenceId?: number | null,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        senderId,
        type,
        message,
        referenceId: referenceId ?? null,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Real-time emission via Socket.IO
    try {
      this.chatGateway.server?.to(`user:${userId}`).emit('notification', notification);
    } catch (err) {
      console.error('Socket emission failed:', err);
    }

    return notification;
  }

  async getNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { success: true };
  }
}
