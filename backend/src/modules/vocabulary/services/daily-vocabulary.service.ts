import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DictionaryService } from '../dictionary.service';
import { TranslateService } from '../../translate/translate.service';
import { CURATED_WORDS, CuratedWord } from '../data/curated-words.data';
import { getDaySeed, shuffleWithSeed } from '../utils/random.util';

@Injectable()
export class DailyVocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dictionaryService: DictionaryService,
    private readonly translateService: TranslateService,
  ) {}

  // Từ vựng mới hàng ngày (Daily Vocabulary) - Tự động xoay vòng từ theo ngày & tra cứu 3rd Party APIs
  async getDailyWords(userId?: number, targetCode?: string, nativeCode?: string) {
    let targetLang = targetCode?.toLowerCase().trim();
    let nativeLang = nativeCode?.toLowerCase().trim();

    // 1. Lấy thông tin ngôn ngữ của người dùng từ CSDL nếu có userId
    const userLearningLangs: { code: string; name: string }[] = [];
    let userNativeLang: string | null = null;

    if (userId) {
      const userLangs = await this.prisma.userLanguage.findMany({
        where: { userId },
        include: { language: true },
        orderBy: { id: 'asc' },
      });

      for (const ul of userLangs) {
        if (ul.role === 'learning' && ul.language?.code) {
          userLearningLangs.push({
            code: ul.language.code.toLowerCase(),
            name: ul.language.name,
          });
        }
        if ((ul.role === 'native' || ul.role === 'fluent') && ul.language?.code && !userNativeLang) {
          userNativeLang = ul.language.code.toLowerCase();
        }
      }
    }

    // 2. Xác định ngôn ngữ mục tiêu (Target Learning Language)
    if (!targetLang) {
      if (userLearningLangs.length > 0) {
        targetLang = userLearningLangs[0].code;
      } else {
        targetLang = 'en';
      }
    }

    // 3. Xác định tiếng mẹ đẻ để giải thích nghĩa (Native Language)
    if (!nativeLang) {
      if (userNativeLang) {
        nativeLang = userNativeLang;
      } else {
        nativeLang = 'vi';
      }
    }

    // Tránh trường hợp targetLang trùng với nativeLang (ví dụ user đang học tiếng Việt mà native cũng là tiếng Việt)
    if (targetLang === nativeLang) {
      if (targetLang === 'vi') {
        nativeLang = 'en';
      } else {
        nativeLang = 'vi';
      }
    }

    const langRecord = await this.prisma.language.findUnique({
      where: { code: targetLang },
    });

    const candidateList: CuratedWord[] = [
      ...(CURATED_WORDS[targetLang] || CURATED_WORDS['en']),
    ];

    // Lấy thêm từ ngẫu nhiên 3rd Party API nếu là tiếng Anh (Datamuse API)
    if (targetLang === 'en') {
      try {
        const randomApiWords = await this.dictionaryService.fetchRandomWords('en', 10);
        for (const rw of randomApiWords) {
          if (!candidateList.some((c) => c.term.toLowerCase() === rw.toLowerCase())) {
            candidateList.push({
              term: rw,
              partOfSpeech: 'EN noun',
              phonetic: '',
              definition: '',
              example: '',
            });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    // Lấy thêm từ trong WordLibrary DB nếu có
    if (langRecord) {
      const dbWords = await this.prisma.wordLibrary.findMany({
        where: { languageId: langRecord.id },
        take: 30,
        orderBy: { createdAt: 'desc' },
      });

      for (const dw of dbWords) {
        if (!candidateList.some((w) => w.term.toLowerCase() === dw.term.toLowerCase())) {
          candidateList.push({
            term: dw.term,
            partOfSpeech: dw.partOfSpeech || `${targetLang.toUpperCase()} từ vựng`,
            phonetic: dw.phonetic || '',
            definition: dw.definition || '',
            example: dw.example || '',
            audioUrl: dw.audioUrl || undefined,
          });
        }
      }
    }

    // Tính toán Day Seed dựa trên mốc ngày hiện tại (YYYY-MM-DD) + Target Language
    const todayStr = new Date().toISOString().split('T')[0];
    const seed = getDaySeed(todayStr, targetLang);
    const shuffledCandidates = shuffleWithSeed(candidateList, seed);

    // Chọn ra 5 từ vựng duy nhất cho ngày hôm nay (theo yêu cầu chuẩn 5 từ)
    const selectedBatch = shuffledCandidates.slice(0, 5);

    // Xử lý song song (Promise.all) tra cứu API & dịch nghĩa sang tiếng mẹ đẻ (nativeLang)
    await Promise.all(
      selectedBatch.map(async (item) => {
        const isCuratedWord = !!item.definition;

        // Tra cứu bổ sung từ điển 3rd party nếu thiếu thông tin
        if (!item.definition || !item.phonetic || !item.audioUrl) {
          try {
            const dictRes = await this.dictionaryService.lookup(item.term, targetLang);
            if (dictRes) {
              if (dictRes.phonetic && !item.phonetic) item.phonetic = dictRes.phonetic;
              if (dictRes.partOfSpeech && !item.partOfSpeech) item.partOfSpeech = dictRes.partOfSpeech;
              if (dictRes.audioUrl && !item.audioUrl) item.audioUrl = dictRes.audioUrl;

              if (dictRes.definition && (!item.definition || item.definition.trim() === '')) {
                item.definition = dictRes.definition;
              }

              if (dictRes.example && (!item.example || item.example.trim() === '')) {
                item.example = `« ${dictRes.example} »`;
              }
            }
          } catch {
            // Bỏ qua lỗi tra cứu 3rd party
          }
        }

        // DỊCH NGHĨA SANG TIẾNG MẸ ĐẺ (nativeLang) CỦA NGƯỜI DÙNG:
        if (item.definition) {
          if (nativeLang === 'vi') {
            // Người dùng có tiếng mẹ đẻ là Tiếng Việt:
            // Nếu từ lấy từ API (tiếng Anh/Wiktionary), tự động dịch sang tiếng Việt
            if (!isCuratedWord) {
              try {
                const transRes = await this.translateService.translate({
                  text: item.definition,
                  target: 'vi',
                  source: 'auto',
                });
                if (transRes?.translation) {
                  item.definition = transRes.translation;
                }
              } catch {
                // Giữ nguyên fallback
              }
            }
            // Nếu là Curated Word (đã có nghĩa tiếng Việt chuẩn tinh tuyển), giữ nguyên 100%!
          } else {
            // Người dùng có tiếng mẹ đẻ khác tiếng Việt (e.g. en, ja, fr, de, es, ko, zh):
            try {
              const transRes = await this.translateService.translate({
                text: item.definition,
                target: nativeLang,
                source: isCuratedWord ? 'vi' : 'auto',
              });
              if (transRes?.translation) {
                item.definition = transRes.translation;
              }
            } catch {
              // Giữ nguyên fallback
            }
          }
        }

        // Đảm bảo thông tin mặc định nếu thiếu
        if (!item.partOfSpeech) item.partOfSpeech = `${targetLang.toUpperCase()} từ vựng`;
        if (!item.phonetic) item.phonetic = `/${item.term}/`;
        if (!item.definition) item.definition = `Từ vựng mới chủ đề ${targetLang.toUpperCase()}`;
        if (!item.example) item.example = `« Study ${item.term} every day with Stududu. »`;

        // Lưu/Cập nhật vào WordLibrary DB để nuôi dữ liệu
        if (langRecord) {
          try {
            await this.prisma.wordLibrary.upsert({
              where: {
                term_languageId: {
                  term: item.term,
                  languageId: langRecord.id,
                },
              },
              create: {
                term: item.term,
                languageId: langRecord.id,
                phonetic: item.phonetic,
                partOfSpeech: item.partOfSpeech,
                definition: item.definition,
                example: item.example,
                audioUrl: item.audioUrl || null,
              },
              update: {
                phonetic: item.phonetic || undefined,
                partOfSpeech: item.partOfSpeech || undefined,
                definition: item.definition || undefined,
                example: item.example || undefined,
                audioUrl: item.audioUrl || undefined,
              },
            });
          } catch {
            // Bỏ qua lỗi trùng bản ghi đồng thời
          }
        }
      }),
    );

    // Tối ưu Query DB: Kiểm tra danh sách từ đã lưu của User
    let savedSet = new Set<string>();
    if (userId) {
      const selectedTerms = selectedBatch.map((w) => w.term.toLowerCase());
      const userSaved = await this.prisma.userSavedWord.findMany({
        where: {
          userId,
          word: {
            term: { in: selectedTerms, mode: 'insensitive' },
          },
        },
        include: { word: true },
      });
      savedSet = new Set(userSaved.map((s) => s.word.term.toLowerCase()));
    }

    return {
      language: {
        code: targetLang,
        name: langRecord?.name || targetLang.toUpperCase(),
      },
      nativeLanguage: nativeLang,
      learningLanguages: userLearningLangs,
      total: selectedBatch.length,
      words: selectedBatch.map((w, index) => ({
        index: index + 1,
        term: w.term,
        partOfSpeech: w.partOfSpeech || `${targetLang.toUpperCase()} từ vựng`,
        phonetic: w.phonetic || `/${w.term}/`,
        definition: w.definition || 'Từ vựng daily',
        example: w.example || '',
        audioUrl: w.audioUrl || null,
        isSaved: savedSet.has(w.term.toLowerCase()),
        languageId: langRecord?.id,
      })),
    };
  }
}
