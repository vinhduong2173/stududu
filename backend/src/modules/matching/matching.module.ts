import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
