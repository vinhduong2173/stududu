import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { SaveWordDto, UpdateLibraryWordDto } from './dto/save-word.dto';
import { VocabularyService } from './vocabulary.service';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // FS-23 — tra từ vựng (dịch + từ điển + thư viện từ)
  @Get('lookup')
  lookup(@Query('term') term: string, @Query('target') target?: string) {
    return this.vocabularyService.lookup(term, target);
  }

  // FS-23 — lưu từ (từ chat hoặc thêm tay)
  @Post('save-word')
  @UseGuards(JwtAuthGuard)
  saveWord(@CurrentUser() user: JwtPayload, @Body() dto: SaveWordDto) {
    return this.vocabularyService.saveWord(user.sub, dto);
  }

  @Get('my-words')
  @UseGuards(JwtAuthGuard)
  myWords(@CurrentUser() user: JwtPayload) {
    return this.vocabularyService.myWords(user.sub);
  }

  @Delete('my-words/:id')
  @UseGuards(JwtAuthGuard)
  removeSavedWord(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.vocabularyService.removeSavedWord(user.sub, id);
  }

  // FS-24 — thư viện từ chung: public, không cần auth
  @Get('library')
  library(@Query('q') q?: string) {
    return this.vocabularyService.library(q);
  }

  // FS-24 — member bổ sung định nghĩa/ví dụ
  @Patch('library/:id')
  @UseGuards(JwtAuthGuard)
  updateLibraryWord(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLibraryWordDto,
  ) {
    return this.vocabularyService.updateLibraryWord(user.sub, id, dto);
  }
}
