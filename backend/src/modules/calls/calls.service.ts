import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallKind, CallStatus, MessageType, Prisma } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import type { Server } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import {
  MAX_CALL_MS,
  RING_TIMEOUT_MS,
  TIMEOUT_WARNING_MS,
} from './calls.constants';
import type {
  CallAcceptPayload,
  CallHistoryItem,
  CallIcePayload,
  CallIncomingEvent,
  CallInvitePayload,
  CallMediaStatePayload,
  CallMessagePayload,
  IceConfigResponse,
  IceServerConfig,
} from './calls.types';

interface CallTimers {
  ring?: NodeJS.Timeout;
  warning?: NodeJS.Timeout;
  hardStop?: NodeJS.Timeout;
}

/**
 * Vòng đời cuộc gọi thoại — audio-call-design.md.
 *
 * Server KHÔNG chạm vào âm thanh: nó chỉ chuyển tiếp SDP/ICE và giữ trạng thái
 * CallSession. Media đi thẳng máy-tới-máy (hoặc qua TURN).
 *
 * Hẹn giờ (đổ chuông 45s, cảnh báo phút 28, tự ngắt phút 30) giữ trong bộ nhớ
 * process. Chấp nhận được vì signaling vốn đã gắn với socket của chính process
 * này; nếu sau này chạy nhiều instance thì phải chuyển sang socket.io-redis
 * adapter + hàng đợi job — ghi lại ở đây để người sau không bị bất ngờ.
 */
@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  private server?: Server;
  private readonly timers = new Map<number, CallTimers>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /** ChatGateway gọi trong afterInit — một chiều, tránh vòng phụ thuộc gateway ↔ service. */
  attachServer(server: Server): void {
    this.server = server;
  }

  // ===== HTTP =====

  /**
   * Mục 7.1 — FE không hardcode ICE server. Đổi credential TURN = sửa .env,
   * không phải build lại frontend.
   */
  getIceConfig(): IceConfigResponse {
    const stunUrls = (
      this.config.get<string>('STUN_URLS') ?? 'stun:stun.l.google.com:19302'
    )
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const iceServers: IceServerConfig[] = stunUrls.map((urls) => ({ urls }));

    const turnUrls = (this.config.get<string>('TURN_URLS') ?? '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    const username = this.config.get<string>('TURN_USERNAME');
    const credential = this.config.get<string>('TURN_CREDENTIAL');

    if (turnUrls.length > 0 && username && credential) {
      iceServers.push({ urls: turnUrls, username, credential });
    } else {
      // Không có TURN thì cuộc gọi vẫn chạy trong LAN nhưng hỏng ở mức 3 (mục 10).
      this.logger.warn(
        'Chưa cấu hình TURN — gọi giữa 2 mạng khác nhau có thể thất bại',
      );
    }

    return { iceServers };
  }

  /** Lịch sử cuộc gọi của một hội thoại (dùng cho tab lịch sử / kiểm tra BR-24). */
  async getHistory(
    userId: number,
    conversationId: number,
  ): Promise<CallHistoryItem[]> {
    await this.chatService.assertParticipant(userId, conversationId);
    return this.prisma.callSession.findMany({
      where: { conversationId },
      orderBy: { invitedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        callerId: true,
        calleeId: true,
        kind: true,
        status: true,
        invitedAt: true,
        startedAt: true,
        endedAt: true,
        durationSec: true,
      },
    });
  }

  // ===== Signaling =====

  /**
   * `call:invite` — BR-20 (phải cùng hội thoại) và BR-21 (block 2 chiều) do
   * assertParticipant lo; ở đây chỉ còn kiểm tra bận / offline.
   */
  async invite(
    callerId: number,
    payload: CallInvitePayload,
  ): Promise<{ callId: number } | { blocked: CallStatus; callId: number }> {
    const { conversationId, calleeId, sdp } = payload;
    const kind = payload.kind ?? CallKind.audio;

    await this.chatService.assertParticipant(callerId, conversationId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: { select: { memberId: true, candidateId: true } } },
    });
    if (!conversation) throw new NotFoundException(this.t('calls.notFound'));

    const { memberId, candidateId } = conversation.match;
    const partnerId = callerId === memberId ? candidateId : memberId;
    if (partnerId !== calleeId)
      throw new ForbiddenException(this.t('calls.notInConversation'));

    const caller = await this.prisma.user.findUnique({
      where: { id: callerId },
      select: { id: true, displayName: true, avatarUrl: true, status: true },
    });
    if (caller?.status !== 'active')
      throw new ForbiddenException(this.t('calls.suspendedNoCall'));

    // Mục 9 (glare) — một trong hai phía đang có cuộc khác thì báo bận ngay,
    // không tạo cuộc chồng lên nhau.
    const busyWith = await this.prisma.callSession.findFirst({
      where: {
        status: { in: [CallStatus.ringing, CallStatus.connected] },
        OR: [
          { callerId: { in: [callerId, calleeId] } },
          { calleeId: { in: [callerId, calleeId] } },
        ],
      },
    });
    if (busyWith) {
      const session = await this.prisma.callSession.create({
        data: {
          conversationId,
          callerId,
          calleeId,
          kind,
          status: CallStatus.busy,
          endedAt: new Date(),
          endReason: 'busy',
        },
      });
      return { blocked: CallStatus.busy, callId: session.id };
    }

    // Đề xuất mục 13.2 — không cho gọi người đang offline, đỡ để người gọi chờ vô ích.
    if (!(await this.isOnline(calleeId))) {
      const session = await this.prisma.callSession.create({
        data: {
          conversationId,
          callerId,
          calleeId,
          kind,
          status: CallStatus.unavailable,
          endedAt: new Date(),
          endReason: 'offline',
        },
      });
      return { blocked: CallStatus.unavailable, callId: session.id };
    }

    const session = await this.prisma.callSession.create({
      data: {
        conversationId,
        callerId,
        calleeId,
        kind,
        status: CallStatus.ringing,
      },
    });

    const incoming: CallIncomingEvent = {
      callId: session.id,
      conversationId,
      caller: {
        id: caller.id,
        displayName: caller.displayName,
        avatarUrl: caller.avatarUrl,
      },
      sdp,
      kind,
    };
    this.emitToUser(calleeId, 'call:incoming', incoming);

    this.setTimers(session.id, {
      ring: setTimeout(() => {
        void this.expireRinging(session.id).catch((err) =>
          this.logger.error(
            `Hết giờ đổ chuông call ${session.id}: ${String(err)}`,
          ),
        );
      }, RING_TIMEOUT_MS),
    });

    return { callId: session.id };
  }

  /** `call:accept` — chỉ người nhận, chỉ khi đang đổ chuông. */
  async accept(
    userId: number,
    { callId, sdp }: CallAcceptPayload,
  ): Promise<void> {
    const session = await this.loadSession(callId);
    if (session.calleeId !== userId)
      throw new ForbiddenException(this.t('calls.notYourCall'));
    if (session.status !== CallStatus.ringing) {
      throw new ForbiddenException(this.t('calls.notRinging'));
    }

    this.clearTimers(callId);
    // startedAt = lúc kết nối, KHÔNG phải lúc bấm gọi — nếu không thì thời gian
    // đổ chuông bị cộng oan vào giờ chat (BR-24).
    await this.prisma.callSession.update({
      where: { id: callId },
      data: { status: CallStatus.connected, startedAt: new Date() },
    });

    this.emitToUser(session.callerId, 'call:accepted', { callId, sdp });

    // BR-23 — cảnh báo phút 28, tự ngắt phút 30.
    this.setTimers(callId, {
      warning: setTimeout(() => {
        const secondsLeft = Math.round(
          (MAX_CALL_MS - TIMEOUT_WARNING_MS) / 1000,
        );
        this.emitToBoth(
          session.callerId,
          session.calleeId,
          'call:timeout-warning',
          {
            callId,
            secondsLeft,
          },
        );
      }, TIMEOUT_WARNING_MS),
      hardStop: setTimeout(() => {
        void this.terminate(callId, CallStatus.ended, 'timeout').catch((err) =>
          this.logger.error(`Tự ngắt call ${callId} thất bại: ${String(err)}`),
        );
      }, MAX_CALL_MS),
    });
  }

  /** `call:reject` — người nhận từ chối. */
  async reject(userId: number, callId: number): Promise<void> {
    const session = await this.loadSession(callId);
    if (session.calleeId !== userId)
      throw new ForbiddenException(this.t('calls.notYourCall'));
    if (session.status !== CallStatus.ringing) return;
    await this.terminate(callId, CallStatus.rejected, 'rejected');
  }

  /** `call:cancel` — người gọi tự huỷ trước khi bên kia bắt máy. */
  async cancel(userId: number, callId: number): Promise<void> {
    const session = await this.loadSession(callId);
    if (session.callerId !== userId)
      throw new ForbiddenException(this.t('calls.notYourCall'));
    if (session.status !== CallStatus.ringing) return;
    await this.terminate(callId, CallStatus.missed, 'cancelled');
  }

  /** `call:end` — cúp máy. Đang đổ chuông thì quy về huỷ/từ chối cho đúng ngữ nghĩa. */
  async end(userId: number, callId: number): Promise<void> {
    const session = await this.loadSession(callId);
    this.assertPartyOf(session, userId);

    if (session.status === CallStatus.ringing) {
      await this.terminate(
        callId,
        session.callerId === userId ? CallStatus.missed : CallStatus.rejected,
        session.callerId === userId ? 'cancelled' : 'rejected',
      );
      return;
    }
    if (session.status !== CallStatus.connected) return;
    await this.terminate(callId, CallStatus.ended, 'hangup');
  }

  /**
   * `call:ice-candidate` — server chỉ chuyển tiếp, không đọc nội dung candidate.
   * Vẫn phải kiểm tra người gửi thuộc cuộc gọi, nếu không thì ai cũng bơm được
   * candidate vào cuộc của người khác.
   */
  async relayIce(
    userId: number,
    { callId, candidate }: CallIcePayload,
  ): Promise<void> {
    const session = await this.loadSession(callId);
    this.assertPartyOf(session, userId);
    if (
      session.status !== CallStatus.ringing &&
      session.status !== CallStatus.connected
    )
      return;

    const targetId =
      session.callerId === userId ? session.calleeId : session.callerId;
    this.emitToUser(targetId, 'call:ice-candidate', { callId, candidate });
  }

  /**
   * `call:media-state` — video-call-upgrade.md mục 4.2. Cũng chỉ chuyển tiếp
   * như ICE: server không lưu trạng thái micro/camera vì nó chỉ có nghĩa trong
   * lúc cuộc gọi đang chạy, hết cuộc là hết giá trị.
   *
   * Vẫn chấp nhận lúc `ringing`: người nhận bấm accept rồi gửi ngay trạng thái
   * ban đầu (BR-37 — nhận cuộc gọi video mà không bật camera), hai handler chạy
   * song song nên có thể tới trước khi accept kịp ghi `connected`.
   */
  async relayMediaState(
    userId: number,
    { callId, audio, video }: CallMediaStatePayload,
  ): Promise<void> {
    const session = await this.loadSession(callId);
    this.assertPartyOf(session, userId);
    if (
      session.status !== CallStatus.ringing &&
      session.status !== CallStatus.connected
    )
      return;

    const targetId =
      session.callerId === userId ? session.calleeId : session.callerId;
    this.emitToUser(targetId, 'call:media-state', {
      callId,
      audio: Boolean(audio),
      video: Boolean(video),
    });
  }

  /**
   * Mục 9 — đóng tab giữa cuộc gọi. Không có bước này thì phía kia treo màn
   * "đang gọi" mãi.
   */
  async handleUserDisconnect(userId: number): Promise<void> {
    // Người dùng có thể mở nhiều tab: chỉ dọn khi không còn socket nào của họ.
    if (await this.isOnline(userId)) return;

    const active = await this.prisma.callSession.findMany({
      where: {
        status: { in: [CallStatus.ringing, CallStatus.connected] },
        OR: [{ callerId: userId }, { calleeId: userId }],
      },
      select: { id: true, status: true, callerId: true },
    });

    for (const session of active) {
      const status =
        session.status === CallStatus.connected
          ? CallStatus.ended
          : session.callerId === userId
            ? CallStatus.missed
            : CallStatus.rejected;
      await this.terminate(session.id, status, 'disconnect').catch((err) =>
        this.logger.error(
          `Dọn call ${session.id} khi disconnect: ${String(err)}`,
        ),
      );
    }
  }

  // ===== Nội bộ =====

  /** Hết 45 giây đổ chuông mà không ai bắt máy. */
  private async expireRinging(callId: number): Promise<void> {
    const session = await this.prisma.callSession.findUnique({
      where: { id: callId },
    });
    if (!session || session.status !== CallStatus.ringing) return;
    await this.terminate(callId, CallStatus.missed, 'timeout');
  }

  /**
   * Điểm kết duy nhất của mọi cuộc gọi: chốt trạng thái, tính thời lượng, dọn
   * timer, báo hai phía và sinh tin nhắn hệ thống (BR-25).
   */
  private async terminate(
    callId: number,
    status: CallStatus,
    endReason: string,
  ): Promise<void> {
    this.clearTimers(callId);

    const session = await this.prisma.callSession.findUnique({
      where: { id: callId },
    });
    if (!session) return;
    // Chống chạy hai lần (vd cả hai phía cùng bấm cúp máy).
    if (
      session.status !== CallStatus.ringing &&
      session.status !== CallStatus.connected
    )
      return;

    const endedAt = new Date();
    const durationSec =
      status === CallStatus.ended && session.startedAt
        ? Math.min(
            Math.max(
              0,
              Math.round(
                (endedAt.getTime() - session.startedAt.getTime()) / 1000,
              ),
            ),
            MAX_CALL_MS / 1000,
          )
        : 0;

    const updated = await this.prisma.callSession.update({
      where: { id: callId },
      data: { status, endedAt, durationSec, endReason },
    });

    const event = { callId, durationSec, endReason };
    if (status === CallStatus.ended) {
      this.emitToBoth(session.callerId, session.calleeId, 'call:ended', event);
    } else if (status === CallStatus.rejected) {
      this.emitToUser(session.callerId, 'call:rejected', event);
      this.emitToUser(session.calleeId, 'call:ended', event);
    } else {
      // missed / failed — cả hai phía đóng UI
      this.emitToBoth(session.callerId, session.calleeId, 'call:missed', event);
    }

    if (
      status === CallStatus.ended ||
      status === CallStatus.missed ||
      status === CallStatus.rejected
    ) {
      await this.createCallMessage(updated, status).catch((err) =>
        this.logger.error(
          `Tạo tin nhắn hệ thống cho call ${callId}: ${String(err)}`,
        ),
      );
    }
  }

  /**
   * BR-25 — cuộc gọi nhỡ / bị từ chối / đã kết thúc sinh một tin nhắn hệ thống
   * trong hội thoại. Ghi thẳng qua Prisma thay vì ChatService.createMessage vì
   * đây không phải tin do người dùng gửi (không validate nội dung, không đụng
   * mốc giờ chat).
   */
  private async createCallMessage(
    session: {
      id: number;
      conversationId: number;
      callerId: number;
      kind: CallKind;
      durationSec: number;
    },
    status: 'ended' | 'missed' | 'rejected' | CallStatus,
  ): Promise<void> {
    const payload: CallMessagePayload = {
      callId: session.id,
      kind: session.kind,
      status: status as CallMessagePayload['status'],
      durationSec: session.durationSec,
      callerId: session.callerId,
    };

    // content chỉ là bản dự phòng cho preview inbox — client render theo payload.
    const label =
      session.kind === CallKind.video ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
    const content =
      status === CallStatus.ended
        ? `${label} · ${formatDuration(session.durationSec)}`
        : status === CallStatus.rejected
          ? `${label} bị từ chối`
          : `${label} nhỡ`;

    const message = await this.prisma.message.create({
      data: {
        conversationId: session.conversationId,
        senderId: session.callerId,
        type: MessageType.call,
        content,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    this.server
      ?.to(`conversation:${session.conversationId}`)
      .emit('message:new', message);
  }

  private async loadSession(callId: number) {
    const session = await this.prisma.callSession.findUnique({
      where: { id: callId },
    });
    if (!session) throw new NotFoundException(this.t('calls.notFound'));
    return session;
  }

  private assertPartyOf(
    session: { callerId: number; calleeId: number },
    userId: number,
  ): void {
    if (session.callerId !== userId && session.calleeId !== userId) {
      throw new ForbiddenException(this.t('calls.notYourCall'));
    }
  }

  private async isOnline(userId: number): Promise<boolean> {
    if (!this.server) return false;
    const sockets = await this.server.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
  }

  private emitToUser(userId: number, event: string, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  private emitToBoth(
    a: number,
    b: number,
    event: string,
    payload: unknown,
  ): void {
    this.emitToUser(a, event, payload);
    this.emitToUser(b, event, payload);
  }

  private setTimers(callId: number, timers: CallTimers): void {
    this.timers.set(callId, { ...this.timers.get(callId), ...timers });
  }

  private clearTimers(callId: number): void {
    const timers = this.timers.get(callId);
    if (!timers) return;
    if (timers.ring) clearTimeout(timers.ring);
    if (timers.warning) clearTimeout(timers.warning);
    if (timers.hardStop) clearTimeout(timers.hardStop);
    this.timers.delete(callId);
  }

  private t(key: string): string {
    return this.i18n.t(`translation.${key}`, {
      lang: I18nContext.current()?.lang,
    });
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
