import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CallsModule } from '../calls/calls.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  // forwardRef: ChatGateway giữ event `call:*` (audio-call-design.md mục 1),
  // còn CallsService cần ChatService.assertParticipant cho BR-20/21.
  imports: [AuthModule, forwardRef(() => CallsModule)],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway], // FS-28: ScheduleModule gửi message + realtime qua gateway
})
export class ChatModule {}
