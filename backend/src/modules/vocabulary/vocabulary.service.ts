import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityPostType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveWordDto, UpdateLibraryWordDto } from './dto/save-word.dto';
import { I18nService } from 'nestjs-i18n';
import { DictionaryService } from './dictionary.service';
import { TranslateService } from '../translate/translate.service';

// BR-12 — WORD_LIBRARY công khai khi đủ ngưỡng người lưu (mỗi user chỉ tính 1 lần
// nhờ UNIQUE(user_id, word_library_id) → save_count = số user khác nhau)
export const WORD_LIBRARY_PUBLIC_THRESHOLD = 3;

@Injectable()
export class VocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
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
    const dictResult = await this.dictionaryService.lookup(trimmed, detectedLang || 'en');

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
          }
        : null,
      library: wordLib
        ? {
            id: wordLib.id,
            definition: wordLib.definition,
            example: wordLib.example,
            languageId: wordLib.languageId,
            languageName: wordLib.language.name,
            saveCount: wordLib.saveCount,
          }
        : null,
    };
  }

  // FS-23 — tìm/tạo WORD_LIBRARY theo (term, language) rồi gắn USER_SAVED_WORD
  async saveWord(userId: number, dto: SaveWordDto) {
    const term = dto.term.trim();

    let word = await this.prisma.wordLibrary.findFirst({
      where: { term: { equals: term, mode: 'insensitive' }, languageId: dto.languageId },
    });
    if (!word) {
      word = await this.prisma.wordLibrary.create({
        data: {
          term,
          languageId: dto.languageId,
          definition: dto.definition,
          example: dto.example,
        },
      });
    } else if ((!word.definition && dto.definition) || (!word.example && dto.example)) {
      word = await this.prisma.wordLibrary.update({
        where: { id: word.id },
        data: {
          definition: word.definition || dto.definition,
          example: word.example || dto.example,
        },
      });
    }

    const existing = await this.prisma.userSavedWord.findUnique({
      where: { userId_wordLibraryId: { userId, wordLibraryId: word.id } },
    });

    // Đã lưu rồi → chỉ cập nhật thời điểm truy cập + ghi chú, KHÔNG tăng save_count
    if (existing) {
      const saved = await this.prisma.userSavedWord.update({
        where: { id: existing.id },
        data: {
          createdAt: new Date(),
          ...(dto.personalNote !== undefined ? { personalNote: dto.personalNote } : {}),
        },
        include: { word: { include: { language: true } } },
      });
      return { saved, duplicated: true };
    }

    const [saved, updatedWord] = await this.prisma.$transaction([
      this.prisma.userSavedWord.create({
        data: {
          userId,
          wordLibraryId: word.id,
          personalNote: dto.personalNote,
          source: dto.source,
        },
        include: { word: { include: { language: true } } },
      }),
      this.prisma.wordLibrary.update({
        where: { id: word.id },
        data: { saveCount: { increment: 1 } },
      }),
    ]);

    // FS-24/BR-12 — đủ ngưỡng thì công khai; FS-25 — tạo activity post cho người vừa lưu
    if (!updatedWord.isPublic && updatedWord.saveCount >= WORD_LIBRARY_PUBLIC_THRESHOLD) {
      await this.prisma.wordLibrary.update({
        where: { id: word.id },
        data: { isPublic: true },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { shareActivity: true },
      });
      if (user?.shareActivity) {
        await this.prisma.activityPost.create({
          data: {
            userId,
            type: ActivityPostType.word_public,
            contentRef: String(word.id),
          },
        });
      }
    }

    return { saved, duplicated: false };
  }

  // FS-23 — sổ từ của tôi, gần nhất trước
  myWords(userId: number) {
    return this.prisma.userSavedWord.findMany({
      where: { userId },
      include: { word: { include: { language: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeSavedWord(userId: number, id: number) {
    const item = await this.prisma.userSavedWord.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Không tìm thấy từ trong sổ của bạn');
    }
    // save_count là số liệu lịch sử — không giảm để tránh từ public bị flip-flop
    await this.prisma.userSavedWord.delete({ where: { id } });
    return { deleted: id };
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
      orderBy: { saveCount: 'desc' },
      take: 100,
    });
  }

  // FS-24 — member bổ sung định nghĩa/ví dụ; lưu updated_by để Admin revert nếu spam
  async updateLibraryWord(userId: number, id: number, dto: UpdateLibraryWordDto) {
    const word = await this.prisma.wordLibrary.findUnique({ where: { id } });
    if (!word) throw new NotFoundException('Không tìm thấy từ trong thư viện');

    return this.prisma.wordLibrary.update({
      where: { id },
      data: { ...dto, updatedById: userId },
      include: { language: true },
    });
  }
}
