import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [ChatModule], // dùng ChatService (assertParticipant, tạo message) + ChatGateway (realtime)
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
