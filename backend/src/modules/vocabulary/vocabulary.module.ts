import { Module } from '@nestjs/common';
import { TranslateModule } from '../translate/translate.module';
import { DictionaryService } from './dictionary.service';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TranslateModule, NotificationModule],
  controllers: [VocabularyController],
  providers: [VocabularyService, DictionaryService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
