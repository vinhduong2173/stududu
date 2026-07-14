import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { ChatService, type ScheduleMessagePayload } from './chat.service';

interface AuthedSocket extends Socket {
  data: { user: JwtPayload };
}

// US-14 — chat real-time; Socket.IO tự reconnect (AC2), room theo conversation
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' },
  maxHttpBufferSize: 2e6, // cho phép tin nhắn ảnh (data URL ~500KB sau nén)
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

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
    await this.chatService.assertParticipant(client.data.user.sub, body.conversationId);
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
    this.server.to(this.room(message.conversationId)).emit('message:update', message);
    return message;
  }

  // Phản hồi lời mời hẹn giờ — cập nhật status trong payload rồi phát message:update
  @SubscribeMessage('schedule:respond')
  async respondSchedule(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { messageId: number; response: 'accepted' | 'declined' },
  ) {
    const message = await this.chatService.respondSchedule(
      client.data.user.sub,
      body.messageId,
      body.response,
    );
    this.server.to(this.room(message.conversationId)).emit('message:update', message);
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

  private room(conversationId: number): string {
    return `conversation:${conversationId}`;
  }
}
