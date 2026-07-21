import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
