import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DictionaryService } from '../dictionary.service';
import { TranslateService } from '../../translate/translate.service';
import { UpdateLibraryWordDto } from '../dto/save-word.dto';

@Injectable()
export class LibraryVocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dictionaryService: DictionaryService,
    private readonly translateService: TranslateService,
  ) {}

  // FS-23 — tra từ vựng thông minh (dịch + từ điển + thư viện từ)
  async lookup(term: string, target = 'vi') {
    const trimmed = term?.trim();
    if (!trimmed) return null;

    // 1. Dịch từ / câu qua TranslateService
    let translation: string | null = null;
    let detectedLang: string | null = null;

    try {
      const transRes = await this.translateService.translate({
        text: trimmed,
        target,
        source: 'auto',
      });
      translation = transRes.translation ?? null;
      detectedLang = transRes.source ?? null;
    } catch {
      detectedLang = 'en';
    }

    // 2. Map sang Language id trong DB
    let language = detectedLang
      ? await this.prisma.language.findUnique({
          where: { code: detectedLang.toLowerCase() },
        })
      : null;

    if (!language) {
      language = await this.prisma.language.findUnique({
        where: { code: 'en' },
      });
    }

    if (!language) {
      language = await this.prisma.language.findFirst();
    }

    const languageId = language?.id ?? 1;

    // 3. Tra từ điển (Free Dictionary API)
    const dictResult = await this.dictionaryService.lookup(
      trimmed,
      detectedLang || 'en',
    );

    // 4. Tra thư viện từ chung (WordLibrary)
    const wordLib = await this.prisma.wordLibrary.findFirst({
      where: {
        term: { equals: trimmed, mode: 'insensitive' },
        languageId,
      },
      include: { language: true },
    });

    return {
      term: trimmed,
      translation,
      detectedLang,
      languageId,
      dictionary: dictResult
        ? {
            phonetic: dictResult.phonetic,
            partOfSpeech: dictResult.partOfSpeech,
            definition: dictResult.definition,
            example: dictResult.example,
            audioUrl: dictResult.audioUrl,
          }
        : null,
      library: wordLib
        ? {
            id: wordLib.id,
            phonetic: wordLib.phonetic,
            partOfSpeech: wordLib.partOfSpeech,
            definition: wordLib.definition,
            example: wordLib.example,
            audioUrl: wordLib.audioUrl,
            languageId: wordLib.languageId,
            languageName: wordLib.language.name,
          }
        : null,
    };
  }

  // FS-24 — thư viện từ chung (public, không cần auth), search theo term
  library(q?: string) {
    const where: Prisma.WordLibraryWhereInput = {
      isPublic: true,
      ...(q ? { term: { contains: q.trim(), mode: 'insensitive' } } : {}),
    };
    return this.prisma.wordLibrary.findMany({
      where,
      include: { language: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // FS-24 — member bổ sung định nghĩa/ví dụ; lưu updated_by để Admin revert nếu spam
  async updateLibraryWord(
    userId: number,
    id: number,
    dto: UpdateLibraryWordDto,
  ) {
    const word = await this.prisma.wordLibrary.findUnique({ where: { id } });
    if (!word) throw new NotFoundException('Không tìm thấy từ trong thư viện');

    return this.prisma.wordLibrary.update({
      where: { id },
      data: { ...dto, updatedById: userId },
      include: { language: true },
    });
  }
}
