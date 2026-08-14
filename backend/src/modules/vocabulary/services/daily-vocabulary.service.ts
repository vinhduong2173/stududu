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
    let targetLang = targetCode?.toLowerCase();
    let nativeLang = nativeCode?.toLowerCase();

    // Nếu không truyền targetCode và có userId -> lấy ngôn ngữ học (learning) của user
    if (!targetLang && userId) {
      const userLangs = await this.prisma.userLanguage.findMany({
        where: { userId, role: 'learning' },
        include: { language: true },
      });
      if (userLangs.length > 0) {
        targetLang = userLangs[0].language.code;
      }
    }
    if (!targetLang) targetLang = 'en';

    // Nếu không truyền nativeCode và có userId -> lấy ngôn ngữ bản địa (native) của user từ CSDL
    if (!nativeLang && userId) {
      const nativeLangRecord = await this.prisma.userLanguage.findFirst({
        where: { userId, role: 'native' },
        include: { language: true },
      });
      if (nativeLangRecord) {
        nativeLang = nativeLangRecord.language.code;
      }
    }
    if (!nativeLang) nativeLang = 'vi';

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

    // Chọn ra 6 từ vựng duy nhất cho ngày hôm nay
    const selectedBatch = shuffledCandidates.slice(0, 6);

    // Xử lý song song (Promise.all) tra cứu API & lưu DB cho 6 từ để tối ưu thời gian phản hồi
    await Promise.all(
      selectedBatch.map(async (item) => {
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

        // Tự động dịch definition sang ngôn ngữ bản địa của user (nativeLang) nếu targetLang != nativeLang
        if (item.definition && targetLang !== nativeLang) {
          try {
            const transRes = await this.translateService.translate({
              text: item.definition,
              target: nativeLang,
              source: 'auto',
            });
            if (transRes?.translation) {
              item.definition = transRes.translation;
            }
          } catch {
            // Fallback giữ nguyên definition
          }
        }

        // Đảm bảo thông tin mặc định nếu API không trả về
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

    // Tối ưu Query DB: Chỉ tìm các từ trong danh sách selectedBatch thay vì lấy toàn bộ từ của user
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
