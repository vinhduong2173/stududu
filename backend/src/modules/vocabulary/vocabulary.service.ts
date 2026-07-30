import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityPostType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveWordDto, UpdateLibraryWordDto } from './dto/save-word.dto';
import { I18nService } from 'nestjs-i18n';
import { DictionaryService } from './dictionary.service';
import { TranslateService } from '../translate/translate.service';

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

    // Cập nhật phonetic vào wordLib nếu trong DB đang trống mà từ điển có
    if (wordLib && !wordLib.phonetic && dictResult?.phonetic) {
      await this.prisma.wordLibrary.update({
        where: { id: wordLib.id },
        data: { phonetic: dictResult.phonetic },
      });
      wordLib.phonetic = dictResult.phonetic;
    }

    const phonetic = dictResult?.phonetic ?? wordLib?.phonetic ?? null;

    return {
      term: trimmed,
      translation,
      detectedLang,
      languageId,
      phonetic,
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
            saveCount: wordLib.saveCount,
          }
        : null,
    };
  }

  // FS-23 — tìm/tạo WORD_LIBRARY theo (term, language) rồi gắn USER_SAVED_WORD
  async saveWord(userId: number, dto: SaveWordDto) {
    const term = dto.term.trim();
    let phonetic = dto.phonetic?.trim();

    // Auto lookup phonetic if missing
    if (!phonetic) {
      const dictRes = await this.dictionaryService.lookup(term, 'en');
      if (dictRes?.phonetic) {
        phonetic = dictRes.phonetic;
      }
    }

    let languageId = dto.languageId;
    if (languageId) {
      const exists = await this.prisma.language.findUnique({
        where: { id: languageId },
      });
      if (!exists) languageId = undefined;
    }

    if (!languageId) {
      const defaultLang =
        (await this.prisma.language.findUnique({ where: { code: 'en' } })) ||
        (await this.prisma.language.findFirst());
      languageId = defaultLang?.id ?? 1;
    }

    let word = await this.prisma.wordLibrary.findFirst({
      where: { term: { equals: term, mode: 'insensitive' }, languageId },
    });

    if (!word) {
      word = await this.prisma.wordLibrary.create({
        data: {
          term,
          languageId,
          phonetic: phonetic || undefined,
          partOfSpeech: dto.partOfSpeech,
          definition: dto.definition,
          example: dto.example,
          audioUrl: dto.audioUrl,
        },
      });
    } else if (
      (!word.definition && dto.definition) ||
      (!word.example && dto.example) ||
      (!word.phonetic && phonetic)
    ) {
      word = await this.prisma.wordLibrary.update({
        where: { id: word.id },
        data: {
          phonetic: word.phonetic || phonetic,
          definition: word.definition || dto.definition,
          example: word.example || dto.example,
        },
      });
    }

    const existing = await this.prisma.userSavedWord.findUnique({
      where: { userId_wordLibraryId: { userId, wordLibraryId: word.id } },
    });

    // Đã lưu rồi → cập nhật ghi chú & trạng thái
    if (existing) {
      const saved = await this.prisma.userSavedWord.update({
        where: { id: existing.id },
        data: {
          createdAt: new Date(),
          ...(dto.personalNote !== undefined
            ? { personalNote: dto.personalNote }
            : {}),
          ...(dto.status ? { status: dto.status } : {}),
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
          status: dto.status || 'learning',
        },
        include: { word: { include: { language: true } } },
      }),
      this.prisma.wordLibrary.update({
        where: { id: word.id },
        data: { saveCount: { increment: 1 } },
      }),
    ]);

    if (
      !updatedWord.isPublic &&
      updatedWord.saveCount >= WORD_LIBRARY_PUBLIC_THRESHOLD
    ) {
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

  // FS-23 — sổ từ của tôi, lọc theo status & search query nếu có
  async myWords(userId: number, status?: string, search?: string) {
    const list = await this.prisma.userSavedWord.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                {
                  word: {
                    term: { contains: search.trim(), mode: 'insensitive' },
                  },
                },
                {
                  personalNote: {
                    contains: search.trim(),
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      include: { word: { include: { language: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-backfill phonetics for words saved previously without phonetic
    const unphoneticWords = list.filter((item) => !item.word.phonetic);
    if (unphoneticWords.length > 0) {
      await Promise.all(
        unphoneticWords.map(async (item) => {
          try {
            const dictResult = await this.dictionaryService.lookup(
              item.word.term,
              item.word.language?.code || 'en',
            );
            if (dictResult?.phonetic) {
              await this.prisma.wordLibrary.update({
                where: { id: item.word.id },
                data: { phonetic: dictResult.phonetic },
              });
              item.word.phonetic = dictResult.phonetic;
            }
          } catch {
            // Ignore error
          }
        }),
      );
    }

    return list;
  }

  // Cập nhật trạng thái từ vựng (learning ↔ mastered)
  async updateWordStatus(userId: number, id: number, status: string) {
    const item = await this.prisma.userSavedWord.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException(
        'Không tìm thấy từ vựng trong sổ tay của bạn.',
      );
    }

    const updated = await this.prisma.userSavedWord.update({
      where: { id },
      data: { status },
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.createdAt,
    };
  }

  async removeSavedWord(userId: number, id: number) {
    const item = await this.prisma.userSavedWord.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Không tìm thấy từ trong sổ của bạn');
    }
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
