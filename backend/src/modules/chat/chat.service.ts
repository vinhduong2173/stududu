import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';

const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGE_DATA_URL_LENGTH = 700_000; // ~500KB ảnh đã nén phía client

// FS-14 — tập emoji reaction cố định (không cho custom)
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'] as const;

// FS-25 — mốc giờ chat tạo activity post (mỗi 10 giờ)
const CHAT_HOURS_MILESTONE_STEP = 10;
const SESSION_IDLE_MS = 30 * 60 * 1000; // BR-14

export interface ReplyToPayload {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  type?: string;
}

export interface ScheduleMessagePayload {
  // FS-28 (mới): tham chiếu SCHEDULE_REQUEST + giờ hẹn UTC
  requestId?: number;
  timeUtc?: string;
  // bản cũ theo khung giờ rảnh — giữ để render tin nhắn lịch sử
  slotId?: string;
  myTimeLabel?: string;
  partnerTimeLabel?: string;
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface ChatMessagePayload extends ScheduleMessagePayload {
  replyTo?: ReplyToPayload | null;
  isEdited?: boolean;
  editedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  // US-15 — Inbox: danh sách hội thoại sắp theo tin mới nhất, kèm tin cuối
  async getConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        match: { OR: [{ memberId: userId }, { candidateId: userId }] },
      },
      include: {
        match: {
          include: {
            member: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                lastActive: true,
                timezone: true,
                availableSlots: true,
              },
            },
            candidate: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                lastActive: true,
                timezone: true,
                availableSlots: true,
              },
            },
          },
        },
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });

    // US-15 AC2 — badge chưa đọc: đếm tin của đối tác chưa có read_at
    const unreadGroups = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    });
    const unreadByConversation = new Map(
      unreadGroups.map((g) => [g.conversationId, g._count._all]),
    );

    return conversations
      .map((c) => {
        const partner =
          c.match.memberId === userId ? c.match.candidate : c.match.member;
        return {
          id: c.id,
          partner,
          lastMessage: c.messages[0] ?? null,
          unreadCount: unreadByConversation.get(c.id) ?? 0,
          createdAt: c.createdAt,
        };
      })
      .sort(
        (a, b) =>
          (b.lastMessage?.sentAt ?? b.createdAt).getTime() -
          (a.lastMessage?.sentAt ?? a.createdAt).getTime(),
      );
  }

  async getMessages(userId: number, conversationId: number) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
    });
  }

  async getTotalUnreadCount(userId: number): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        match: { OR: [{ memberId: userId }, { candidateId: userId }] },
      },
      select: { id: true },
    });
    if (conversations.length === 0) return 0;
    const conversationIds = conversations.map((c) => c.id);
    return this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        readAt: null,
      },
    });
  }

  async getPartnerId(
    conversationId: number,
    currentUserId: number,
  ): Promise<number | null> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: { select: { memberId: true, candidateId: true } } },
    });
    if (!conv) return null;
    return conv.match.memberId === currentUserId
      ? conv.match.candidateId
      : conv.match.memberId;
  }

  // US-14 — lưu tin nhắn: text | image (data URL) | schedule (lời mời hẹn giờ)
  async createMessage(
    userId: number,
    conversationId: number,
    content: string,
    type: MessageType = MessageType.text,
    payload?: ChatMessagePayload,
  ) {
    // US-20 AC1 — tài khoản bị khóa không nhắn tin được (socket không qua JwtStrategy)
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (sender?.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('translation.auth.suspendedNoChat', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    await this.assertParticipant(userId, conversationId);
    this.validateMessage(content, type, payload);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
          type,
          payload: payload
            ? (payload as unknown as Prisma.InputJsonValue)
            : undefined,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() },
      }),
    ]);

    // FS-25 — kiểm tra mốc giờ chat (fire-and-forget, chỉ ~1/10 tin để nhẹ DB)
    if (message.id % 10 === 0) {
      void this.checkChatHoursMilestone(userId).catch(() => undefined);
    }

    return message;
  }

  // Chỉnh sửa tin nhắn của chính mình
  async editMessage(userId: number, messageId: number, newContent: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException(
        this.i18n.t('translation.chat.messageNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('Chỉ có thể chỉnh sửa tin nhắn của chính mình');
    }
    const currentPayload = (message.payload as Record<string, any> | null) ?? {};
    if (currentPayload.isDeleted) {
      throw new BadRequestException('Không thể chỉnh sửa tin nhắn đã xóa');
    }
    if (message.type !== MessageType.text) {
      throw new BadRequestException('Chỉ có thể chỉnh sửa tin nhắn văn bản');
    }
    const trimmed = newContent.trim();
    if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) {
      throw new BadRequestException('Độ dài tin nhắn không hợp lệ');
    }

    const updatedPayload = {
      ...currentPayload,
      isEdited: true,
      editedAt: new Date().toISOString(),
    };

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: trimmed,
        payload: updatedPayload as Prisma.InputJsonValue,
      },
    });
  }

  // Xóa / Thu hồi tin nhắn của chính mình
  async deleteMessage(userId: number, messageId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException(
        this.i18n.t('translation.chat.messageNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('Chỉ có thể xóa tin nhắn của chính mình');
    }
    const currentPayload = (message.payload as Record<string, any> | null) ?? {};
    if (currentPayload.isDeleted) {
      return message;
    }

    const updatedPayload = {
      ...currentPayload,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    };

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: '',
        payload: updatedPayload as Prisma.InputJsonValue,
      },
    });
  }

  // FS-14 — toggle reaction emoji trên tin nhắn (tập cố định REACTION_EMOJIS)
  async toggleReaction(userId: number, messageId: number, emoji: string) {
    if (!REACTION_EMOJIS.includes(emoji as (typeof REACTION_EMOJIS)[number])) {
      throw new BadRequestException(
        this.i18n.t('translation.chat.invalidEmoji', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message)
      throw new NotFoundException(
        this.i18n.t('translation.chat.messageNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );
    await this.assertParticipant(userId, message.conversationId);

    const reactions =
      (message.reactions as Record<string, number[]> | null) ?? {};
    const users = new Set(reactions[emoji] ?? []);
    if (users.has(userId)) users.delete(userId);
    else users.add(userId);

    if (users.size === 0) delete reactions[emoji];
    else reactions[emoji] = [...users];

    return this.prisma.message.update({
      where: { id: messageId },
      data: { reactions: reactions },
    });
  }

  // FS-25 — vượt mốc mỗi 10 giờ chat thì tạo activity post (nếu user bật share_activity)
  private async checkChatHoursMilestone(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { shareActivity: true },
    });
    if (!user?.shareActivity) return;

    const hours = await this.computeChatHours(userId);
    const milestone =
      Math.floor(hours / CHAT_HOURS_MILESTONE_STEP) * CHAT_HOURS_MILESTONE_STEP;
    if (milestone < CHAT_HOURS_MILESTONE_STEP) return;

    const lastPost = await this.prisma.activityPost.findFirst({
      where: { userId, type: 'chat_hours_milestone' },
      orderBy: { createdAt: 'desc' },
    });
    const lastMilestone = lastPost ? Number(lastPost.contentRef) : 0;
    if (milestone <= lastMilestone) return;

    await this.prisma.activityPost.create({
      data: {
        userId,
        type: 'chat_hours_milestone',
        contentRef: String(milestone),
      },
    });
  }

  // BR-14 — tổng giờ chat, cắt phiên khi idle > 30 phút (dùng cho trigger milestone)
  // BR-24 — cộng thêm thời lượng cuộc gọi thoại đã kết thúc (audio-call-design.md mục 6)
  private async computeChatHours(userId: number): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: { match: { OR: [{ memberId: userId }, { candidateId: userId }] } },
      include: {
        messages: { orderBy: { sentAt: 'asc' }, select: { sentAt: true } },
      },
    });

    let totalMs = 0;
    for (const conv of conversations) {
      const times = conv.messages.map((m) => m.sentAt.getTime());
      if (times.length === 0) continue;
      let sessionStart = times[0];
      let prev = times[0];
      for (const t of times.slice(1)) {
        if (t - prev > SESSION_IDLE_MS) {
          totalMs += prev - sessionStart;
          sessionStart = t;
        }
        prev = t;
      }
      totalMs += prev - sessionStart;
    }

    const callTime = await this.prisma.callSession.aggregate({
      where: {
        status: 'ended',
        conversation: {
          match: { OR: [{ memberId: userId }, { candidateId: userId }] },
        },
      },
      _sum: { durationSec: true },
    });
    totalMs += (callTime._sum.durationSec ?? 0) * 1000;

    return totalMs / 3_600_000;
  }

  // Đối tác phản hồi lời mời hẹn giờ (accepted/declined)
  async respondSchedule(
    userId: number,
    messageId: number,
    response: 'accepted' | 'declined',
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.type !== MessageType.schedule) {
      throw new NotFoundException(
        this.i18n.t('translation.chat.scheduleNotFound', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    await this.assertParticipant(userId, message.conversationId);
    if (message.senderId === userId) {
      throw new BadRequestException(
        this.i18n.t('translation.chat.noSelfScheduleRespond', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const payload = message.payload as unknown as ScheduleMessagePayload;
    if (payload.status !== 'pending') {
      throw new BadRequestException(
        this.i18n.t('translation.chat.alreadyResponded', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        payload: { ...payload, status: response },
      },
    });
  }

  private validateMessage(
    content: string,
    type: MessageType,
    payload?: ScheduleMessagePayload,
  ): void {
    const lang = I18nContext.current()?.lang;
    if (type === MessageType.text) {
      if (!content.trim())
        throw new BadRequestException(
          this.i18n.t('translation.chat.emptyMessage', { lang }),
        );
      if (content.length > MAX_TEXT_LENGTH) {
        throw new BadRequestException(
          this.i18n.t('translation.chat.messageTooLong', {
            lang,
            args: { max: MAX_TEXT_LENGTH },
          }),
        );
      }
    } else if (type === MessageType.image) {
      if (!content.startsWith('data:image/')) {
        throw new BadRequestException(
          this.i18n.t('translation.chat.invalidImage', { lang }),
        );
      }
      if (content.length > MAX_IMAGE_DATA_URL_LENGTH) {
        throw new BadRequestException(
          this.i18n.t('translation.chat.imageTooLarge', { lang }),
        );
      }
    } else if (type === MessageType.call) {
      // BR-25 — chỉ CallsService được sinh tin nhắn tổng kết cuộc gọi; nếu không
      // client tự bịa được "cuộc gọi 30 phút" và làm sai giờ chat (BR-24).
      throw new BadRequestException(
        this.i18n.t('translation.chat.callMessageNotAllowed', { lang }),
      );
    } else if (type === MessageType.schedule) {
      // FS-28: bản mới cần requestId + timeUtc; bản cũ cần slotId + labels
      const isNewShape = Boolean(payload?.requestId && payload?.timeUtc);
      const isLegacyShape = Boolean(payload?.slotId && payload?.myTimeLabel);
      if (!isNewShape && !isLegacyShape) {
        throw new BadRequestException(
          this.i18n.t('translation.chat.missingScheduleInfo', { lang }),
        );
      }
    }
  }

  // US-15 AC3 — đánh dấu đã đọc
  async markRead(userId: number, conversationId: number) {
    await this.assertParticipant(userId, conversationId);
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // Chỉ 2 thành viên của match được vào hội thoại; chặn nếu đã block nhau (US-18 AC2)
  async assertParticipant(
    userId: number,
    conversationId: number,
  ): Promise<void> {
    const lang = I18nContext.current()?.lang;
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    if (!conversation)
      throw new NotFoundException(
        this.i18n.t('translation.chat.conversationNotFound', { lang }),
      );

    const { memberId, candidateId } = conversation.match;
    if (userId !== memberId && userId !== candidateId) {
      throw new ForbiddenException(
        this.i18n.t('translation.chat.notInConversation', { lang }),
      );
    }

    const partnerId = userId === memberId ? candidateId : memberId;
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: userId },
        ],
      },
    });
    if (blocked)
      throw new ForbiddenException(
        this.i18n.t('translation.chat.blockedUser', { lang }),
      );
  }
}
