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
            saveCount: wordLib.saveCount,
          }
        : null,
    };
  }

  // FS-23 — tìm/tạo WORD_LIBRARY theo (term, language) rồi gắn USER_SAVED_WORD
  async saveWord(userId: number, dto: SaveWordDto) {
    const term = dto.term.trim();

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
      try {
        word = await this.prisma.wordLibrary.create({
          data: {
            term,
            languageId,
            phonetic: dto.phonetic,
            partOfSpeech: dto.partOfSpeech,
            definition: dto.definition,
            example: dto.example,
            audioUrl: dto.audioUrl,
          },
        });
      } catch {
        word = await this.prisma.wordLibrary.findFirst({
          where: { term: { equals: term, mode: 'insensitive' }, languageId },
        });
        if (!word) {
          throw new NotFoundException('Không thể lưu từ vựng vào thư viện');
        }
      }
    } else {
      // Cập nhật thông tin bổ sung nếu trước đó còn thiếu
      const updateData: Prisma.WordLibraryUpdateInput = {};
      if (!word.phonetic && dto.phonetic) updateData.phonetic = dto.phonetic;
      if (!word.partOfSpeech && dto.partOfSpeech)
        updateData.partOfSpeech = dto.partOfSpeech;
      if (!word.definition && dto.definition)
        updateData.definition = dto.definition;
      if (!word.example && dto.example) updateData.example = dto.example;
      if (!word.audioUrl && dto.audioUrl) updateData.audioUrl = dto.audioUrl;

      if (Object.keys(updateData).length > 0) {
        word = await this.prisma.wordLibrary.update({
          where: { id: word.id },
          data: updateData,
        });
      }
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
  myWords(userId: number, status?: string, search?: string) {
    const where: Prisma.UserSavedWordWhereInput = {
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
                personalNote: { contains: search.trim(), mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    return this.prisma.userSavedWord.findMany({
      where,
      include: { word: { include: { language: true } } },
      orderBy: { createdAt: 'desc' },
    });
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

  // Từ vựng mới hàng ngày (Daily Vocabulary) theo ngôn ngữ người dùng đang học
  async getDailyWords(userId?: number, targetCode?: string) {
    let targetLang = targetCode?.toLowerCase();

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

    const langRecord = await this.prisma.language.findUnique({
      where: { code: targetLang },
    });

    const CURATED_WORDS: Record<
      string,
      Array<{
        term: string;
        partOfSpeech: string;
        phonetic: string;
        definition: string;
        example: string;
      }>
    > = {
      fr: [
        {
          term: 'résilience',
          partOfSpeech: 'FR danh từ',
          phonetic: '/re.zi.ljɑ̃s/',
          definition: 'Sự kiên cường, khả năng phục hồi',
          example: '« Sa résilience face aux difficultés est admirable. »',
        },
        {
          term: 'flâner',
          partOfSpeech: 'FR động từ',
          phonetic: '/fla.ne/',
          definition: 'Đi dạo thong dong, thưởng ngoạn phố phường',
          example: '« J’aime flâner dans les rues de Paris. »',
        },
        {
          term: 'bienveillance',
          partOfSpeech: 'FR danh từ',
          phonetic: '/bjɛ̃.vɛ.jɑ̃s/',
          definition: 'Lòng tốt, sự nhân từ ấm áp',
          example: '« Il traite chacun avec une grande bienveillance. »',
        },
        {
          term: 'éphémère',
          partOfSpeech: 'FR tính từ',
          phonetic: '/e.fe.mɛʁ/',
          definition: 'Chóng tàn, phù du ngắn ngủi',
          example: '« La beauté de cette fleur est éphémère. »',
        },
        {
          term: 'dépaysement',
          partOfSpeech: 'FR danh từ',
          phonetic: '/de.pe.iz.mɑ̃/',
          definition: 'Cảm giác lạ lẫm, tươi mới ở xứ xa',
          example: '« Voyager offre un réel dépaysement. »',
        },
        {
          term: 'savoir-faire',
          partOfSpeech: 'FR danh từ',
          phonetic: '/sa.vwaʁ.fɛʁ/',
          definition: 'Bí quyết, kỹ năng khéo léo',
          example: '« Ce produit reflète un savoir-faire d’exception. »',
        },
      ],
      en: [
        {
          term: 'resilience',
          partOfSpeech: 'EN noun',
          phonetic: '/rɪˈzɪl.jəns/',
          definition: 'Sự kiên cường, khả năng đứng dậy sau thất bại',
          example:
            '« Her resilience in overcoming obstacles is truly inspiring. »',
        },
        {
          term: 'serendipity',
          partOfSpeech: 'EN noun',
          phonetic: '/ˌser.ənˈdɪp.ə.ti/',
          definition: 'Sự tình cờ may mắn, nhân duyên bất ngờ',
          example: '« Finding this cozy cafe was pure serendipity. »',
        },
        {
          term: 'ubiquitous',
          partOfSpeech: 'EN adjective',
          phonetic: '/juːˈbɪk.wə.təs/',
          definition: 'Có mặt ở khắp mọi nơi',
          example: '« Smartphones have become ubiquitous in modern life. »',
        },
        {
          term: 'ephemeral',
          partOfSpeech: 'EN adjective',
          phonetic: '/ɪˈfem.ər.əl/',
          definition: 'Chóng vánh, tồn tại trong thời gian ngắn',
          example: '« Trends on social media are often ephemeral. »',
        },
        {
          term: 'benevolent',
          partOfSpeech: 'EN adjective',
          phonetic: '/bəˈnev.əl.ənt/',
          definition: 'Nhân từ, giàu lòng bác ái',
          example: '« A benevolent donor funded the new learning space. »',
        },
        {
          term: 'eloquent',
          partOfSpeech: 'EN adjective',
          phonetic: '/ˈel.ə.kwənt/',
          definition: 'Hùng hồn, giàu sức thuyết phục',
          example: '« She delivered an eloquent speech to the audience. »',
        },
        {
          term: 'pragmatic',
          partOfSpeech: 'EN adjective',
          phonetic: '/præɡˈmæt.ɪk/',
          definition: 'Thực tế, chú trọng tính hiệu quả',
          example: '« We need a pragmatic solution to this problem. »',
        },
        {
          term: 'perseverance',
          partOfSpeech: 'EN noun',
          phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
          definition: 'Sự kiên trì, nhẫn nại vượt khó',
          example: '« Perseverance is key to mastering any language. »',
        },
        {
          term: 'meticulous',
          partOfSpeech: 'EN adjective',
          phonetic: '/məˈtɪk.jə.ləs/',
          definition: 'Tỉ mỉ, chỉn chu từng chi tiết',
          example: '« He took meticulous notes during the entire lecture. »',
        },
        {
          term: 'enthusiasm',
          partOfSpeech: 'EN noun',
          phonetic: '/ɪnˈθjuː.zi.æz.əm/',
          definition: 'Sự hăng hái, nhiệt huyết bùng nổ',
          example: '« Her enthusiasm for learning languages is contagious. »',
        },
        {
          term: 'solitude',
          partOfSpeech: 'EN noun',
          phonetic: '/ˈsɒl.ɪ.tʃuːd/',
          definition: 'Sự tĩnh lặng, thanh thản khi ở một mình',
          example: '« He enjoyed the peaceful solitude of the mountains. »',
        },
        {
          term: 'nostalgia',
          partOfSpeech: 'EN noun',
          phonetic: '/nɒsˈtæl.dʒə/',
          definition: 'Nỗi hoài niệm, kí ức xưa cũ',
          example: '« The old songs filled him with nostalgia. »',
        },
      ],
      ja: [
        {
          term: '木漏れ日 (komorebi)',
          partOfSpeech: 'JA danh từ',
          phonetic: '/ko.mo.re.bi/',
          definition: 'Ánh nắng ấm áp chiếu rọi qua kẽ lá',
          example: '« 森の中で綺麗な木漏れ日を見た。 »',
        },
        {
          term: '一期一会 (ichigo ichie)',
          partOfSpeech: 'JA danh từ',
          phonetic: '/i.tʃi.ɡo i.tʃi.e/',
          definition:
            'Nhất kỳ nhất hội — cuộc gặp gỡ quý giá chỉ có một lần trong đời',
          example: '« 人との出会いを一期一会として大切にする。 »',
        },
        {
          term: '生き甲斐 (ikigai)',
          partOfSpeech: 'JA danh từ',
          phonetic: '/i.ki.ga.i/',
          definition: 'Lý do thức dậy mỗi sáng, mục đích sống',
          example: '« 毎日の言語学習が私の生き甲斐です。 »',
        },
        {
          term: '侘寂 (wabi-sabi)',
          partOfSpeech: 'JA danh từ',
          phonetic: '/wa.bi sa.bi/',
          definition: 'Vẻ đẹp mộc mạc, bình dị và sự vĩnh cửu của thời gian',
          example: '« 日本の伝統美には侘寂の心がある。 »',
        },
      ],
      ko: [
        {
          term: '설레다 (seolleda)',
          partOfSpeech: 'KR động từ',
          phonetic: '/seol.re.da/',
          definition: 'Cảm giác rộn rã, xao xuyến trong lòng',
          example: '« 새로운 시작을 앞두고 마음이 설레다. »',
        },
        {
          term: '소소하다 (sosohada)',
          partOfSpeech: 'KR tính từ',
          phonetic: '/so.so.ha.da/',
          definition: 'Nho nhỏ, bình dị mà ấm áp',
          example: '« 소소한 행복을 느끼며 살고 싶다. »',
        },
        {
          term: '정 (jeong)',
          partOfSpeech: 'KR danh từ',
          phonetic: '/jeong/',
          definition: 'Tình cảm nồng hậu, sự gắn bó thân thương',
          example: '« 한국 사람들은 정이 많다. »',
        },
        {
          term: '눈치 (nunchi)',
          partOfSpeech: 'KR danh từ',
          phonetic: '/nun.chi/',
          definition: 'Sự tin tế, nhạy bén đọc vị tình huống',
          example: '« 그 사람은 눈치가 빠르다. »',
        },
      ],
      zh: [
        {
          term: '缘分 (yuánfèn)',
          partOfSpeech: 'ZH danh từ',
          phonetic: '/yuán fèn/',
          definition: 'Duyên phận, sự kết nối tình cờ diệu kỳ',
          example: '« 我们能在这里相遇真是很有缘分。 »',
        },
        {
          term: '加油 (jiāyóu)',
          partOfSpeech: 'ZH động từ',
          phonetic: '/jiā yóu/',
          definition: 'Cố lên! Nỗ lực tiến về phía trước',
          example: '« 考试加油，你一定可以的！ »',
        },
        {
          term: '沉淀 (chéndiàn)',
          partOfSpeech: 'ZH động từ',
          phonetic: '/chén diàn/',
          definition: 'Tích lũy, lắng đọng tri thức và trải nghiệm',
          example: '« 学习需要时间的沉淀。 »',
        },
      ],
      es: [
        {
          term: 'querencia',
          partOfSpeech: 'ES danh từ',
          phonetic: '/ke.ˈɾen.sja/',
          definition: 'Chốn bình yên mang lại cảm giác an toàn',
          example: '« Regresar a casa era su querencia. »',
        },
        {
          term: 'sobremesa',
          partOfSpeech: 'ES danh từ',
          phonetic: '/so.βɾe.ˈme.sa/',
          definition: 'Khoảnh khắc trò chuyện ấm áp sau bữa ăn',
          example: '« Disfrutamos de una larga sobremesa. »',
        },
      ],
      de: [
        {
          term: 'Feierabend',
          partOfSpeech: 'DE danh từ',
          phonetic: '/ˈfaɪ̯ɐˌʔaːbn̩t/',
          definition: 'Thời gian thư thái sau một ngày làm việc',
          example: '« Schönen Feierabend allerseits! »',
        },
        {
          term: 'Fernweh',
          partOfSpeech: 'DE danh từ',
          phonetic: '/ˈfɛʁnˌveː/',
          definition: 'Khao khát mãnh liệt được đi xa khám phá thế giới',
          example: '« Ich habe großes Fernweh nach dem Meer. »',
        },
      ],
    };

    const wordList = CURATED_WORDS[targetLang] || CURATED_WORDS['en'];

    // Lấy thêm từ từ WordLibrary trong DB nếu có
    if (langRecord) {
      const dbWords = await this.prisma.wordLibrary.findMany({
        where: { languageId: langRecord.id },
        take: 10,
        orderBy: { saveCount: 'desc' },
      });

      if (dbWords.length > 0) {
        const mappedDbWords = dbWords.map((w) => ({
          term: w.term,
          partOfSpeech: w.partOfSpeech || `${targetLang.toUpperCase()} từ vựng`,
          phonetic: w.phonetic || '',
          definition: w.definition || 'Định nghĩa từ cộng đồng',
          example: w.example || '',
        }));
        // Ghép thêm từ DB nếu chưa trùng term
        for (const dw of mappedDbWords) {
          if (
            !wordList.some(
              (w) => w.term.toLowerCase() === dw.term.toLowerCase(),
            )
          ) {
            wordList.push(dw);
          }
        }
      }
    }

    // Kiểm tra xem user đã lưu từ nào trong danh sách này chưa
    let savedSet = new Set<string>();
    if (userId) {
      const userSaved = await this.prisma.userSavedWord.findMany({
        where: { userId },
        include: { word: true },
      });
      savedSet = new Set(userSaved.map((s) => s.word.term.toLowerCase()));
    }

    return {
      language: {
        code: targetLang,
        name: langRecord?.name || targetLang.toUpperCase(),
      },
      total: wordList.length,
      words: wordList.map((w, index) => ({
        index: index + 1,
        term: w.term,
        partOfSpeech: w.partOfSpeech,
        phonetic: w.phonetic,
        definition: w.definition,
        example: w.example,
        isSaved: savedSet.has(w.term.toLowerCase()),
        languageId: langRecord?.id,
      })),
    };
  }
}
