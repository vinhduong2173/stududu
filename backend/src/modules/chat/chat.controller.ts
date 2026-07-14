import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { ChatService } from './chat.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // US-15 — Inbox
  @Get()
  getConversations(@CurrentUser() user: JwtPayload) {
    return this.chatService.getConversations(user.sub);
  }

  @Get(':id/messages')
  getMessages(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.chatService.getMessages(user.sub, id);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.chatService.markRead(user.sub, id);
  }
}
