import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DictionaryService } from '../dictionary.service';
import { TranslateService } from '../../translate/translate.service';
import { UpdateLibraryWordDto } from '../dto/save-word.dto';
import { CURATED_WORDS } from '../data/curated-words.data';

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

  // FS-23 — Lấy danh sách đáp án nhiễu (distractors) ngẫu nhiên cho Quiz từ vựng
  async getDistractors(native = 'vi', target = 'en'): Promise<string[]> {
    const distractors: string[] = [];

    // 1. Lấy định nghĩa từ WordLibrary DB
    try {
      const dbWords = await this.prisma.wordLibrary.findMany({
        where: {
          definition: { not: null },
        },
        select: { definition: true },
        take: 50,
        orderBy: { saveCount: 'desc' },
      });
      for (const w of dbWords) {
        if (w.definition && w.definition.trim().length > 3) {
          distractors.push(w.definition.trim());
        }
      }
    } catch {
      // Ignore DB errors
    }

    // 2. Lấy định nghĩa từ CURATED_WORDS
    const curated = [
      ...(CURATED_WORDS[target] || []),
      ...(CURATED_WORDS[native] || []),
      ...(CURATED_WORDS['en'] || []),
      ...(CURATED_WORDS['vi'] || []),
    ];
    for (const c of curated) {
      if (c.definition && c.definition.trim().length > 3) {
        distractors.push(c.definition.trim());
      }
    }

    // 3. Fallback distractors
    const fallbackList =
      NATIVE_FALLBACK_DISTRACTORS[native] || NATIVE_FALLBACK_DISTRACTORS['vi'];
    distractors.push(...fallbackList);

    const unique = Array.from(new Set(distractors)).filter(Boolean);
    return unique.sort(() => Math.random() - 0.5).slice(0, 30);
  }
}

const NATIVE_FALLBACK_DISTRACTORS: Record<string, string[]> = {
  vi: [
    'Sự kiên trì và nỗ lực bền bỉ vượt qua thử thách',
    'Nguồn cảm hứng sáng tạo dồi dào và độc đáo',
    'Khả năng thích ứng nhanh chóng với hoàn cảnh mới',
    'Sự đồng cảm, tinh tế và thấu hiểu sâu sắc',
    'Thành tựu xuất sắc nổi bật và đáng tự hào',
    'Sự tập trung cao độ và minh mẫn trong công việc',
    'Sự bộc phát năng lượng tích cực và nhiệt huyết',
    'Tạo ra ảnh hưởng sâu rộng, tích cực và lâu dài',
    'Sự hòa đồng, chân thành và thân thiện với mọi người',
    'Tầm nhìn chiến lược dài hạn và nhạy bén',
    'Cơ sở và nền móng vững chắc, đáng tin cậy',
    'Tư duy thực tế, logic và giải quyết vấn đề',
    'Sự bình tĩnh, điềm tĩnh trước mọi áp lực',
    'Tinh thần tự học và khám phá tri thức mới',
    'Sự khéo léo và tỉ mỉ trong từng chi tiết',
  ],
  en: [
    'Perseverance and continuous effort through challenges',
    'Abundant creative inspiration and innovative thinking',
    'Adaptability to new and complex environments',
    'Deep empathy and genuine mutual understanding',
    'Outstanding achievement and personal success',
    'High focus, clarity, and mental concentration',
    'Positive energy, enthusiasm, and warmth',
    'Strong, lasting, and meaningful impact',
    'Friendly, open, and sociable personality',
    'Long-term strategic vision and foresight',
  ],
  fr: [
    'Dynamisme et énergie positive au quotidien',
    'Inspiration créative abondante et constante',
    'Capacité d’adaptation rapide aux nouvelles situations',
    'Persévérance remarquable et effort continu',
    'Empathie profonde et compréhension mutuelle',
  ],
};

