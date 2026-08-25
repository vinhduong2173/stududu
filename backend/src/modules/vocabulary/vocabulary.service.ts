import { Injectable } from '@nestjs/common';
import { SaveWordDto, UpdateLibraryWordDto } from './dto/save-word.dto';
import { DailyVocabularyService } from './services/daily-vocabulary.service';
import { UserVocabularyService } from './services/user-vocabulary.service';
import { LibraryVocabularyService } from './services/library-vocabulary.service';

@Injectable()
export class VocabularyService {
  constructor(
    private readonly dailyService: DailyVocabularyService,
    private readonly userService: UserVocabularyService,
    private readonly libraryService: LibraryVocabularyService,
  ) {}

  lookup(term: string, target = 'vi') {
    return this.libraryService.lookup(term, target);
  }

  saveWord(userId: number, dto: SaveWordDto) {
    return this.userService.saveWord(userId, dto);
  }

  myWords(userId: number, status?: string, search?: string) {
    return this.userService.myWords(userId, status, search);
  }

  updateWordStatus(userId: number, id: number, status: string) {
    return this.userService.updateWordStatus(userId, id, status);
  }

  removeSavedWord(userId: number, id: number) {
    return this.userService.removeSavedWord(userId, id);
  }

  library(q?: string) {
    return this.libraryService.library(q);
  }

  updateLibraryWord(userId: number, id: number, dto: UpdateLibraryWordDto) {
    return this.libraryService.updateLibraryWord(userId, id, dto);
  }

  getDailyWords(userId?: number, targetCode?: string, nativeCode?: string) {
    return this.dailyService.getDailyWords(userId, targetCode, nativeCode);
  }

  getDistractors(native?: string, target?: string) {
    return this.libraryService.getDistractors(native, target);
  }
}
