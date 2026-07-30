import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CallsService } from '../calls/calls.service';
import type {
  CallAcceptPayload,
  CallAck,
  CallIcePayload,
  CallIdPayload,
  CallInvitePayload,
  CallMediaStatePayload,
} from '../calls/calls.types';
import { ChatService, type ScheduleMessagePayload } from './chat.service';

interface AuthedSocket extends Socket {
  data: { user: JwtPayload };
}

/**
 * CORS_ORIGIN có thể chứa nhiều origin ngăn cách bằng dấu phẩy (main.ts và
 * auth.controller.ts đều đã tách). Truyền thẳng chuỗi vào Socket.IO thì nó trả
 * nguyên `Access-Control-Allow-Origin: http://a,http://b` — header chỉ được
 * mang MỘT giá trị nên trình duyệt chặn toàn bộ handshake.
 */
function corsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return ['http://localhost:3000', 'http://localhost:3002'];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// US-14 — chat real-time; Socket.IO tự reconnect (AC2), room theo conversation
// Gọi thoại (audio-call-design.md) dùng chung gateway này: hai @WebSocketGateway
// cùng namespace mặc định sẽ chạy handleConnection hai lần → verify JWT hai lần.
@WebSocketGateway({
  cors: { origin: corsOrigins(), credentials: true },
  maxHttpBufferSize: 2e6, // cho phép tin nhắn ảnh (data URL ~500KB sau nén)
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => CallsService))
    private readonly callsService: CallsService,
  ) {}

  afterInit(server: Server) {
    // Một chiều gateway → service: CallsService cần server để đẩy event từ
    // timer (hết giờ đổ chuông, BR-23) chứ không chỉ từ handler.
    this.callsService.attachServer(server);
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token = (client.handshake.auth as { token?: string }).token;
      if (!token) throw new Error('missing token');
      client.data.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      // Room theo user — để đẩy in-app notification (FS-28: nhắc lịch hẹn)
      await client.join(`user:${client.data.user.sub}`);
    } catch {
      this.logger.warn(`Socket ${client.id} bị từ chối: token không hợp lệ`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: number },
  ) {
    await this.chatService.assertParticipant(
      client.data.user.sub,
      body.conversationId,
    );
    await client.join(this.room(body.conversationId));
    return { joined: body.conversationId };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: {
      conversationId: number;
      content: string;
      type?: 'text' | 'image' | 'schedule';
      payload?: ScheduleMessagePayload;
    },
  ) {
    const message = await this.chatService.createMessage(
      client.data.user.sub,
      body.conversationId,
      body.content,
      body.type ?? 'text',
      body.payload,
    );
    // phát cho cả 2 phía trong room (kể cả người gửi — làm ack)
    this.server.to(this.room(body.conversationId)).emit('message:new', message);
    return message;
  }

  // FS-14 — toggle reaction emoji rồi phát message:update cho cả 2 phía
  @SubscribeMessage('message:react')
  async reactMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { messageId: number; emoji: string },
  ) {
    const message = await this.chatService.toggleReaction(
      client.data.user.sub,
      body.messageId,
      body.emoji,
    );
    this.server
      .to(this.room(message.conversationId))
      .emit('message:update', message);
    return message;
  }

  // Phản hồi lời mời hẹn giờ — cập nhật status trong payload rồi phát message:update
  @SubscribeMessage('schedule:respond')
  async respondSchedule(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: { messageId: number; response: 'accepted' | 'declined' },
  ) {
    const message = await this.chatService.respondSchedule(
      client.data.user.sub,
      body.messageId,
      body.response,
    );
    this.server
      .to(this.room(message.conversationId))
      .emit('message:update', message);
    return message;
  }

  @SubscribeMessage('conversation:read')
  async markRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: number },
  ) {
    await this.chatService.markRead(client.data.user.sub, body.conversationId);
    this.server.to(this.room(body.conversationId)).emit('conversation:read', {
      conversationId: body.conversationId,
      readerId: client.data.user.sub,
    });
  }

  // ===== Gọi thoại — audio-call-design.md mục 4 =====

  /**
   * Lỗi trong handler socket không có ValidationPipe/ExceptionFilter như HTTP,
   * nên gói lại thành ack `{ ok: false, error }` để client hiện đúng thông báo
   * thay vì im lặng treo màn "đang gọi".
   */
  private async ack<T extends object>(
    fn: () => Promise<T>,
  ): Promise<CallAck<T>> {
    try {
      return { ok: true, ...(await fn()) };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thực hiện được';
      this.logger.warn(`call event lỗi: ${message}`);
      return { ok: false, error: message };
    }
  }

  @SubscribeMessage('call:invite')
  async callInvite(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallInvitePayload,
  ) {
    return this.ack(() => this.callsService.invite(client.data.user.sub, body));
  }

  @SubscribeMessage('call:accept')
  async callAccept(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallAcceptPayload,
  ) {
    return this.ack(async () => {
      await this.callsService.accept(client.data.user.sub, body);
      return {};
    });
  }

  @SubscribeMessage('call:reject')
  async callReject(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallIdPayload,
  ) {
    return this.ack(async () => {
      await this.callsService.reject(client.data.user.sub, body.callId);
      return {};
    });
  }

  @SubscribeMessage('call:cancel')
  async callCancel(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallIdPayload,
  ) {
    return this.ack(async () => {
      await this.callsService.cancel(client.data.user.sub, body.callId);
      return {};
    });
  }

  @SubscribeMessage('call:end')
  async callEnd(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallIdPayload,
  ) {
    return this.ack(async () => {
      await this.callsService.end(client.data.user.sub, body.callId);
      return {};
    });
  }

  @SubscribeMessage('call:ice-candidate')
  async callIce(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallIcePayload,
  ) {
    return this.ack(async () => {
      await this.callsService.relayIce(client.data.user.sub, body);
      return {};
    });
  }

  /** video-call-upgrade.md mục 4.2 — báo phía kia biết mình vừa tắt/bật camera. */
  @SubscribeMessage('call:media-state')
  async callMediaState(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: CallMediaStatePayload,
  ) {
    return this.ack(async () => {
      await this.callsService.relayMediaState(client.data.user.sub, body);
      return {};
    });
  }

  /** Mục 9 — đóng tab giữa cuộc gọi thì phía kia phải được báo, đừng treo mãi. */
  async handleDisconnect(client: AuthedSocket) {
    const userId = client.data?.user?.sub;
    if (!userId) return; // socket bị chặn ngay ở handshake

    // Socket.IO rời room sau khi handler disconnect chạy xong, nên chờ một
    // vòng event loop rồi mới đếm socket còn lại của user (hỗ trợ nhiều tab).
    setImmediate(() => {
      void this.callsService
        .handleUserDisconnect(userId)
        .catch((err) =>
          this.logger.error(`Dọn cuộc gọi khi disconnect: ${String(err)}`),
        );
    });
  }

  private room(conversationId: number): string {
    return `conversation:${conversationId}`;
  }
}
