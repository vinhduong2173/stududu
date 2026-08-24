import { Module } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { DictionaryService } from './dictionary.service';
import { TranslateModule } from '../translate/translate.module';
import { DailyVocabularyService } from './services/daily-vocabulary.service';
import { UserVocabularyService } from './services/user-vocabulary.service';
import { LibraryVocabularyService } from './services/library-vocabulary.service';

@Module({
  imports: [TranslateModule],
  controllers: [VocabularyController],
  providers: [
    VocabularyService,
    DictionaryService,
    DailyVocabularyService,
    UserVocabularyService,
    LibraryVocabularyService,
  ],
  exports: [
    VocabularyService,
    DictionaryService,
    DailyVocabularyService,
    UserVocabularyService,
    LibraryVocabularyService,
  ],
})
export class VocabularyModule {}
