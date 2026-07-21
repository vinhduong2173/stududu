import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityPostType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TranslateService } from '../translate/translate.service';
import { DictionaryService } from './dictionary.service';
import { NotificationService } from '../notification/notification.service';
import { SaveWordDto, UpdateLibraryWordDto } from './dto/save-word.dto';

// BR-12 — WORD_LIBRARY công khai khi đủ ngưỡng người lưu (mỗi user chỉ tính 1 lần
// nhờ UNIQUE(user_id, word_library_id) → save_count = số user khác nhau)
export const WORD_LIBRARY_PUBLIC_THRESHOLD = 3;

@Injectable()
export class VocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translateService: TranslateService,
    private readonly dictionaryService: DictionaryService,
    private readonly notificationService: NotificationService,
  ) {}

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
    } else {
      word = await this.prisma.wordLibrary.update({
        where: { id: word.id },
        data: {
          definition: dto.definition || word.definition,
          example: dto.example || word.example,
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
        const post = await this.prisma.activityPost.create({
          data: {
            userId,
            type: ActivityPostType.word_public,
            contentRef: String(word.id),
          },
        });
        try {
          await this.notificationService.notifyFollowersNewPost(userId, post.id);
        } catch (err) {
          console.error('Failed to notify followers of public word post:', err);
        }
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

  // Tra từ nhanh — gộp 3 nguồn (Dictionary API + Translate + Word Library) trong 1 request
  async lookup(term: string, targetLang = 'vi') {
    const trimmed = term.trim();
    if (!trimmed) return { term: trimmed, translation: null, detectedLang: null, dictionary: null, library: null };

    // Chạy song song 3 nguồn để giảm latency
    const [dictResult, translateResult, libraryWord] = await Promise.all([
      this.dictionaryService.lookup(trimmed),
      this.translateService.translate({ text: trimmed, source: 'auto', target: targetLang }).catch(() => null),
      this.prisma.wordLibrary.findFirst({
        where: { term: { equals: trimmed, mode: 'insensitive' } },
        include: { language: true },
      }),
    ]);

    // Tìm languageId tương ứng với ngôn ngữ được detect
    let languageId = libraryWord?.languageId ?? null;
    if (!languageId && translateResult?.source) {
      const dbLang = await this.prisma.language.findUnique({
        where: { code: translateResult.source },
      });
      if (dbLang) {
        languageId = dbLang.id;
      }
    }

    // Fallback nếu không detect được hoặc không khớp database: chọn ngôn ngữ đầu tiên hoặc tiếng Anh
    if (!languageId) {
      const fallbackLang = await this.prisma.language.findFirst({
        where: { code: 'en' },
      }) || await this.prisma.language.findFirst();
      languageId = fallbackLang?.id ?? 1; // Default to 1 if no languages in DB
    }

    return {
      term: trimmed,
      translation: translateResult?.translation ?? null,
      detectedLang: translateResult?.source ?? null,
      languageId,
      dictionary: dictResult,
      library: libraryWord
        ? {
            id: libraryWord.id,
            definition: libraryWord.definition,
            example: libraryWord.example,
            languageId: libraryWord.languageId,
            languageName: libraryWord.language.name,
            saveCount: libraryWord.saveCount,
          }
        : null,
    };
  }
}
