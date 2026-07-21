import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AuthModule, NotificationModule], // JwtService cho auth tùy chọn ở feed public
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
