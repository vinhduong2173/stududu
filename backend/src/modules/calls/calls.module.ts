import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

/**
 * Gọi thoại — audio-call-design.md.
 *
 * Không có gateway riêng: các event `call:*` nằm trong ChatGateway để tránh hai
 * @WebSocketGateway cùng namespace cùng chạy handleConnection (mục 1). Vì thế
 * ChatModule ↔ CallsModule tham chiếu vòng, giải bằng forwardRef.
 */
@Module({
  imports: [AuthModule, forwardRef(() => ChatModule)],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
