import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { LanguageModule } from './modules/language/language.module';
import { MatchingModule } from './modules/matching/matching.module';
import { CommunityModule } from './modules/community/community.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { TranslateModule } from './modules/translate/translate.module';
import { TrustModule } from './modules/trust/trust.module';
import { UserModule } from './modules/user/user.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    LanguageModule,
    MatchingModule,
    ChatModule,
    TrustModule,
    AdminModule,
    VocabularyModule, // FS-23/24 — thay module vocab cũ
    TranslateModule,
    CommunityModule, // FS-25
    ScheduleModule, // FS-28
  ],
})
export class AppModule {}
