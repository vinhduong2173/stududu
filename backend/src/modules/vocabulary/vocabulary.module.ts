import { Module } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { DictionaryService } from './dictionary.service';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [TranslateModule],
  controllers: [VocabularyController],
  providers: [VocabularyService, DictionaryService],
  exports: [VocabularyService, DictionaryService],
})
export class VocabularyModule {}
