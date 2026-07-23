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
import { NotificationModule } from './modules/notification/notification.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      fallbacks: {
        'vi-VN': 'vi',
        'vi_VN': 'vi',
        'vi-*': 'vi',
        'en-US': 'en',
        'en-GB': 'en',
        'en_US': 'en',
        'en_GB': 'en',
        'en-*': 'en',
        'zh-CN': 'zh',
        'zh-TW': 'zh',
        'zh_CN': 'zh',
        'zh_TW': 'zh',
        'zh-*': 'zh',
        'ja-JP': 'ja',
        'ja_JP': 'ja',
        'ja-*': 'ja',
        'ko-KR': 'ko',
        'ko_KR': 'ko',
        'ko-*': 'ko',
        'fr-FR': 'fr',
        'fr_FR': 'fr',
        'fr-*': 'fr',
        'es-ES': 'es',
        'es_ES': 'es',
        'es-*': 'es',
        'de-DE': 'de',
        'de_DE': 'de',
        'de-*': 'de',
        'chn': 'zh',
        'esp': 'es',
        'fra': 'fr',
        'ger': 'de',
        'jpn': 'ja',
        'kor': 'ko',
      },
      loaderOptions: {
        path: (() => {
          const p1 = path.join(__dirname, '/i18n/');
          const p2 = path.join(__dirname, '../i18n/');
          return require('fs').existsSync(p1) ? p1 : p2;
        })(),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
    }),
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
    NotificationModule,
  ],
})
export class AppModule {}
