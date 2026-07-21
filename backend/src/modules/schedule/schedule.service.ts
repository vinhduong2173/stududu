import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService, type ScheduleMessagePayload } from '../chat/chat.service';
import { CreateScheduleDto, RespondScheduleDto, CancelScheduleDto } from './dto/schedule.dto';

// BR-15 — lưu UTC, tự expire sau 48h không phản hồi; nhắc trước giờ hẹn 30 phút
const EXPIRE_AFTER_MS = 48 * 60 * 60 * 1000;
const REMINDER_BEFORE_MS = 30 * 60 * 1000;
const CRON_INTERVAL_MS = 60 * 1000;

@Injectable()
export class ScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleService.name);
  private cronTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  onModuleInit() {
    this.cronTimer = setInterval(() => {
      void this.runCron().catch((err: Error) =>
        this.logger.warn(`Schedule cron lỗi: ${err.message}`),
      );
    }, CRON_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cronTimer) clearInterval(this.cronTimer);
  }

  // FS-28 — tạo lời mời hẹn trong 1 conversation + bắn tin nhắn schedule realtime
  async create(userId: number, dto: CreateScheduleDto) {
    const proposedTime = new Date(dto.proposedTimeUtc);
    if (proposedTime.getTime() <= Date.now()) {
      throw new BadRequestException('Thời gian hẹn phải ở tương lai');
    }

    await this.chatService.assertParticipant(userId, dto.conversationId);

    const request = await this.prisma.scheduleRequest.create({
      data: {
        conversationId: dto.conversationId,
        proposerId: userId,
        proposedTimeUtc: proposedTime,
      },
    });

    const payload: ScheduleMessagePayload = {
      requestId: request.id,
      timeUtc: proposedTime.toISOString(),
      status: 'pending',
    };
    const message = await this.chatService.createMessage(
      userId,
      dto.conversationId,
      `📅 Lời mời hẹn trò chuyện`,
      'schedule',
      payload,
    );
    this.chatGateway.server
      .to(`conversation:${dto.conversationId}`)
      .emit('message:new', message);

    return { request, message };
  }

  // FS-28 — đối phương phản hồi accept/decline
  async respond(userId: number, requestId: number, dto: RespondScheduleDto) {
    const request = await this.prisma.scheduleRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Không tìm thấy lời mời hẹn');
    await this.chatService.assertParticipant(userId, request.conversationId);
    if (request.proposerId === userId) {
      throw new BadRequestException('Người mời không thể tự phản hồi');
    }
    if (request.status !== ScheduleStatus.pending) {
      throw new BadRequestException('Lời mời này đã được phản hồi hoặc đã hết hạn');
    }

    const status =
      dto.action === 'accept' ? ScheduleStatus.accepted : ScheduleStatus.declined;
    const updated = await this.prisma.scheduleRequest.update({
      where: { id: requestId },
      data: { status },
    });
    await this.syncMessageStatus(requestId, status);
    return updated;
  }

  async cancel(userId: number, requestId: number, dto: CancelScheduleDto) {
    const request = await this.prisma.scheduleRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Không tìm thấy lịch hẹn');

    await this.chatService.assertParticipant(userId, request.conversationId);

    if (
      request.status !== ScheduleStatus.accepted &&
      request.status !== ScheduleStatus.pending
    ) {
      throw new BadRequestException('Chỉ có thể hủy lịch hẹn đang chờ hoặc đã đồng ý');
    }

    const updated = await this.prisma.scheduleRequest.update({
      where: { id: requestId },
      data: {
        status: ScheduleStatus.cancelled,
        cancelReason: dto.reason,
      },
    });

    await this.syncMessageStatus(requestId, ScheduleStatus.cancelled, dto.reason);

    return updated;
  }

  /** Lịch sắp tới (đã accept, còn ở tương lai) của user — hiển thị nhắc trên UI */
  upcoming(userId: number) {
    return this.prisma.scheduleRequest.findMany({
      where: {
        status: ScheduleStatus.accepted,
        proposedTimeUtc: { gt: new Date() },
        conversation: {
          match: { OR: [{ memberId: userId }, { candidateId: userId }] },
        },
      },
      orderBy: { proposedTimeUtc: 'asc' },
      take: 10,
    });
  }

  // Cron mỗi phút: (1) expire pending quá 48h — BR-15; (2) nhắc 30 phút trước giờ hẹn
  private async runCron() {
    const now = Date.now();

    // (1) auto-expire
    const stale = await this.prisma.scheduleRequest.findMany({
      where: {
        status: ScheduleStatus.pending,
        createdAt: { lt: new Date(now - EXPIRE_AFTER_MS) },
      },
    });
    for (const req of stale) {
      await this.prisma.scheduleRequest.update({
        where: { id: req.id },
        data: { status: ScheduleStatus.expired },
      });
      await this.syncMessageStatus(req.id, ScheduleStatus.expired);
    }

    // (2) nhắc lịch in-app qua Socket.IO cho cả 2 phía
    const due = await this.prisma.scheduleRequest.findMany({
      where: {
        status: ScheduleStatus.accepted,
        reminderSentAt: null,
        proposedTimeUtc: { gt: new Date(now), lte: new Date(now + REMINDER_BEFORE_MS) },
      },
      include: { conversation: { include: { match: true } } },
    });
    for (const req of due) {
      const { memberId, candidateId } = req.conversation.match;
      const notification = {
        type: 'schedule_reminder',
        scheduleId: req.id,
        timeUtc: req.proposedTimeUtc.toISOString(),
        message: 'Sắp đến giờ hẹn trò chuyện (30 phút nữa) — chuẩn bị nhé!',
      };
      this.chatGateway.server.to(`user:${memberId}`).emit('notification', notification);
      this.chatGateway.server.to(`user:${candidateId}`).emit('notification', notification);
      await this.prisma.scheduleRequest.update({
        where: { id: req.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  // Đồng bộ status vào tin nhắn schedule tương ứng + phát message:update
  private async syncMessageStatus(
    requestId: number,
    status: ScheduleStatus,
    cancelReason?: string,
  ) {
    const message = await this.prisma.message.findFirst({
      where: {
        type: 'schedule',
        payload: { path: ['requestId'], equals: requestId },
      },
    });
    if (!message) return;

    const payload = message.payload as unknown as ScheduleMessagePayload;
    const newPayload = { ...payload, status };
    if (cancelReason !== undefined) {
      newPayload.cancelReason = cancelReason;
    }
    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: { payload: newPayload as unknown as Prisma.InputJsonValue },
    });
    this.chatGateway.server
      .to(`conversation:${message.conversationId}`)
      .emit('message:update', updated);
  }
}
