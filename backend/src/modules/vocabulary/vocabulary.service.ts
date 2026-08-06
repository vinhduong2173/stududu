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
      const localDetected = this.translateService.detectLang(trimmed);
      if (localDetected !== 'en') {
        detectedLang = localDetected;
      } else {
        detectedLang = transRes.source && transRes.source !== 'auto' ? transRes.source : localDetected;
      }
    } catch {
      detectedLang = this.translateService.detectLang(trimmed);
    }

    // 2. Map sang Language id trong DB
    let language = detectedLang
      ? await this.prisma.language.findUnique({
          where: { code: detectedLang.toLowerCase() },
        })
      : null;

    if (!language) {
      const fallbackCode = this.translateService.detectLang(trimmed);
      language = await this.prisma.language.findUnique({ where: { code: fallbackCode } });
    }

    if (!language) {
      language = await this.prisma.language.findUnique({ where: { code: 'en' } }) || await this.prisma.language.findFirst();
    }

    const languageId = language?.id ?? 1;

    // 3. Tra từ điển (Free Dictionary API)
    let dictResult = await this.dictionaryService.lookup(trimmed, detectedLang || 'en');
    if (!dictResult && detectedLang && detectedLang !== 'en') {
      // Tra thử với lang='en' làm dự phòng cho từ vay mượn
      dictResult = await this.dictionaryService.lookup(trimmed, 'en');
    }

    // Dịch định nghĩa từ điển sang ngôn ngữ native/target người dùng nếu khác tiếng Anh
    let dictDefinition = dictResult?.definition || null;
    if (dictDefinition && target) {
      try {
        const transDef = await this.translateService.translate({
          text: dictDefinition,
          target,
          source: 'auto',
        });
        if (transDef?.translation) {
          dictDefinition = transDef.translation;
        }
      } catch {
        // ignore translate error
      }
    }

    // 4. Tra thư viện từ chung (WordLibrary)
    const wordLib = await this.prisma.wordLibrary.findFirst({
      where: {
        term: { equals: trimmed, mode: 'insensitive' },
        languageId,
      },
      include: { language: true },
    });

    let libDefinition = wordLib?.definition || null;
    if (libDefinition && target && target !== 'en' && /^[a-zA-Z0-9\s.,;:'"()\-«»]+$/.test(libDefinition.trim())) {
      try {
        const transLibDef = await this.translateService.translate({
          text: libDefinition,
          target,
          source: 'auto',
        });
        if (transLibDef?.translation) {
          libDefinition = transLibDef.translation;
        }
      } catch {
        // ignore translate error
      }
    }

    const effectiveExample =
      dictResult?.example ||
      wordLib?.example ||
      this.getFallbackExample(trimmed, detectedLang || 'en');

    const effectiveDict = dictResult
      ? {
          phonetic: dictResult.phonetic,
          partOfSpeech: dictResult.partOfSpeech,
          definition: dictDefinition || translation,
          example: effectiveExample,
          audioUrl: dictResult.audioUrl,
        }
      : translation
      ? {
          phonetic: null,
          partOfSpeech: null,
          definition: translation,
          example: effectiveExample,
          audioUrl: null,
        }
      : null;

    return {
      term: trimmed,
      translation,
      detectedLang,
      languageId,
      dictionary: effectiveDict,
      library: wordLib
        ? {
            id: wordLib.id,
            phonetic: wordLib.phonetic,
            partOfSpeech: wordLib.partOfSpeech,
            definition: libDefinition || translation,
            example: wordLib.example || effectiveExample,
            audioUrl: wordLib.audioUrl,
            languageId: wordLib.languageId,
            languageName: wordLib.language.name,
            saveCount: wordLib.saveCount,
          }
        : null,
    };
  }

  // Tạo ví dụ minh họa tự nhiên bằng ngôn ngữ học khi từ điển không có ví dụ mẫu
  private getFallbackExample(term: string, lang = 'en'): string {
    const key = term.trim().toLowerCase();
    const l = lang.toLowerCase();

    const CURATED_EXAMPLES: Record<string, string> = {
      'creme': 'Elle aime ajouter de la crème fraîche dans sa recette de gâteau.',
      'crème': 'Elle aime ajouter de la crème fraîche dans sa recette de gâteau.',
      'café': 'Je bois une tasse de café chaud chaque matin au petit-déjeuner.',
      'bonjour': 'Bonjour, comment allez-vous aujourd’hui ?',
      'merci': 'Merci beaucoup pour votre précieuse aide.',
      'wabi-sabi': '日本の伝統美には侘寂の心がある。',
      '侘寂': '日本の伝統美には侘寂の心がある。',
      'hola': '¡Hola! ¿Cómo estás hoy con tus estudios?',
      'danke': 'Vielen Dank für Ihre freundliche Unterstützung.',
      'amour': 'L’amour est une force puissante qui unit les êtres.',
      'monde': 'Le monde est rempli de merveilles à découvrir.',
      'temps': 'Le temps passe vite quand on est passionné.',
      'vie': 'La vie là-bas est paisible et agréable.',
      'constitution': 'He has a strong constitution, so he should make a quick recovery from the illness.',
      'prohibit': 'The school rules strictly prohibit using mobile phones during exams.',
      'miracle': 'It was a miracle that everyone survived the accident unhurt.',
      'casual': 'He wore casual clothes to the weekend party.',
      'ironic': 'It is ironic that the fire station burned down.',
      'cosmic': 'Scientists study cosmic radiation to learn about the universe.',
      'twilight': 'We went for a walk along the beach in the evening twilight.',
      'abundant': 'The region is rich in abundant natural resources.',
      'ubiquitous': 'Smartphones have become ubiquitous in modern everyday life.',
    };

    if (CURATED_EXAMPLES[key]) {
      return CURATED_EXAMPLES[key];
    }

    if (l === 'fr') {
      return `L’utilisation du terme « ${term} » illustre parfaitement la pensée dans cette phrase.`;
    }
    if (l === 'es') {
      return `El término «${term}» se utiliza para expresar una idea fundamental en este texto.`;
    }
    if (l === 'de') {
      return `Der Begriff „${term}“ wird in diesem Satz verwendet, um eine klare Bedeutung zu vermitteln.`;
    }
    if (l === 'ja') {
      return `文章の中で「${term}」という言葉を使うことで、意味がより明確になります。`;
    }
    if (l === 'ko') {
      return `문장에서 「${term}」라는 단어를 사용하여 의미를 더 명확하게 전달합니다.`;
    }
    if (l === 'zh') {
      return `在句子中正确使用「${term}」一词，可以使表达更加生动准确。`;
    }
    if (l === 'vi') {
      return `Việc sử dụng từ « ${term} » giúp diễn đạt ý tưởng một cách rõ ràng và chính xác.`;
    }

    return `The word '${term}' plays an important role in expressing this idea clearly.`;
  }

  // FS-23 — tìm/tạo WORD_LIBRARY theo (term, language) rồi gắn USER_SAVED_WORD
  async saveWord(userId: number, dto: SaveWordDto) {
    const term = dto.term.trim();

    let languageId = dto.languageId;
    if (languageId) {
      const exists = await this.prisma.language.findUnique({ where: { id: languageId } });
      if (!exists) languageId = undefined;
    }

    if (!languageId) {
      const detectedCode = this.translateService.detectLang(term);
      const matched = await this.prisma.language.findUnique({ where: { code: detectedCode } });
      if (matched) {
        languageId = matched.id;
      } else {
        const defaultLang =
          (await this.prisma.language.findUnique({ where: { code: 'en' } })) ||
          (await this.prisma.language.findFirst());
        languageId = defaultLang?.id ?? 1;
      }
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
      if (!word.partOfSpeech && dto.partOfSpeech) updateData.partOfSpeech = dto.partOfSpeech;
      if (!word.definition && dto.definition) updateData.definition = dto.definition;
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
          ...(dto.personalNote !== undefined ? { personalNote: dto.personalNote } : {}),
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

  // FS-23 — sổ từ của tôi, lọc theo status & search query nếu có
  myWords(userId: number, status?: string, search?: string) {
    const where: Prisma.UserSavedWordWhereInput = {
      userId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { word: { term: { contains: search.trim(), mode: 'insensitive' } } },
              { personalNote: { contains: search.trim(), mode: 'insensitive' } },
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
      throw new NotFoundException('Không tìm thấy từ vựng trong sổ tay của bạn.');
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
  async updateLibraryWord(userId: number, id: number, dto: UpdateLibraryWordDto) {
    const word = await this.prisma.wordLibrary.findUnique({ where: { id } });
    if (!word) throw new NotFoundException('Không tìm thấy từ trong thư viện');

    return this.prisma.wordLibrary.update({
      where: { id },
      data: { ...dto, updatedById: userId },
      include: { language: true },
    });
  }

  // Từ vựng mới hàng ngày (Daily Vocabulary) theo ngôn ngữ người dùng chọn/đang học và dịch nghĩa theo ngôn ngữ native của người dùng
  async getDailyWords(userId?: number, targetCode?: string, nativeCode?: string) {
    let targetLang = targetCode?.trim().toLowerCase();
    let nativeLang = nativeCode?.trim().toLowerCase();

    // 1. Nếu không truyền targetCode và có userId -> lấy ngôn ngữ đang học (learning) của user
    if (!targetLang && userId) {
      const userLangs = await this.prisma.userLanguage.findMany({
        where: { userId, role: 'learning' },
        include: { language: true },
      });
      if (userLangs.length > 0) {
        targetLang = userLangs[0].language.code.toLowerCase();
      }
    }
    if (!targetLang) targetLang = 'en';

    // 2. Nếu không truyền nativeCode và có userId -> lấy ngôn ngữ mẹ đẻ (native) của user
    if (!nativeLang && userId) {
      const userNative = await this.prisma.userLanguage.findMany({
        where: { userId, role: 'native' },
        include: { language: true },
      });
      if (userNative.length > 0) {
        nativeLang = userNative[0].language.code.toLowerCase();
      }
    }
    if (!nativeLang) {
      nativeLang = targetLang === 'vi' ? 'en' : 'vi';
    }

    const langRecord = await this.prisma.language.findUnique({
      where: { code: targetLang },
    });

    const CURATED_POOLS: Record<
      string,
      Array<{
        term: string;
        partOfSpeech: string;
        phonetic: string;
        baseDefinition: string;
        example: string;
      }>
    > = {
      en: [
        { term: 'resilience', partOfSpeech: 'noun', phonetic: '/rɪˈzɪl.jəns/', baseDefinition: 'The capacity to recover quickly from difficulties; toughness and adaptability.', example: '« Her resilience in overcoming obstacles is truly inspiring. »' },
        { term: 'serendipity', partOfSpeech: 'noun', phonetic: '/ˌser.ənˈdɪp.ə.ti/', baseDefinition: 'The occurrence of finding valuable or agreeable things by chance.', example: '« Finding this cozy cafe was pure serendipity. »' },
        { term: 'ubiquitous', partOfSpeech: 'adjective', phonetic: '/juːˈbɪk.wə.təs/', baseDefinition: 'Present, appearing, or found everywhere at the same time.', example: '« Smartphones have become ubiquitous in modern life. »' },
        { term: 'ephemeral', partOfSpeech: 'adjective', phonetic: '/ɪˈfem.ər.əl/', baseDefinition: 'Lasting for a very short time; fleeting.', example: '« Trends on social media are often ephemeral. »' },
        { term: 'benevolent', partOfSpeech: 'adjective', phonetic: '/bəˈnev.əl.ənt/', baseDefinition: 'Well meaning and kindly; serving a charitable purpose.', example: '« A benevolent donor funded the new learning space. »' },
        { term: 'eloquent', partOfSpeech: 'adjective', phonetic: '/ˈel.ə.kwənt/', baseDefinition: 'Fluent or persuasive in speaking or writing.', example: '« She delivered an eloquent speech to the audience. »' },
        { term: 'pragmatic', partOfSpeech: 'adjective', phonetic: '/præɡˈmæt.ɪk/', baseDefinition: 'Dealing with things sensibly and realistically based on practical considerations.', example: '« We need a pragmatic solution to this problem. »' },
        { term: 'perseverance', partOfSpeech: 'noun', phonetic: '/ˌpɜː.sɪˈvɪə.rəns/', baseDefinition: 'Persistence in doing something despite difficulty or delay in achieving success.', example: '« Perseverance is key to mastering any language. »' },
        { term: 'meticulous', partOfSpeech: 'adjective', phonetic: '/məˈtɪk.jə.ləs/', baseDefinition: 'Showing great attention to detail; very careful and precise.', example: '« He took meticulous notes during the entire lecture. »' },
        { term: 'enthusiasm', partOfSpeech: 'noun', phonetic: '/ɪnˈθjuː.zi.æz.əm/', baseDefinition: 'Intense and eager enjoyment, interest, or approval.', example: '« Her enthusiasm for learning languages is contagious. »' },
        { term: 'solitude', partOfSpeech: 'noun', phonetic: '/ˈsɒl.ɪ.tʃuːd/', baseDefinition: 'The state or situation of being alone, especially in peaceful surroundings.', example: '« He enjoyed the peaceful solitude of the mountains. »' },
        { term: 'nostalgia', partOfSpeech: 'noun', phonetic: '/nɒsˈtæl.dʒə/', baseDefinition: 'A sentimental longing or affection for the past.', example: '« The old songs filled him with nostalgia. »' },
        { term: 'luminous', partOfSpeech: 'adjective', phonetic: '/ˈluː.mɪ.nəs/', baseDefinition: 'Full of or shedding light; bright or shining, especially in the dark.', example: '« The room was filled with soft, luminous sunlight. »' },
        { term: 'compassion', partOfSpeech: 'noun', phonetic: '/kəmˈpæʃ.ən/', baseDefinition: 'Sympathetic pity and concern for the sufferings or misfortunes of others.', example: '« Show compassion and kindness to everyone you meet. »' },
        { term: 'versatile', partOfSpeech: 'adjective', phonetic: '/ˈvɜː.sə.taɪl/', baseDefinition: 'Able to adapt or be adapted to many different functions or activities.', example: '« Leather is a versatile material used for many products. »' },
        { term: 'audacious', partOfSpeech: 'adjective', phonetic: '/ɔːˈdeɪ.ʃəs/', baseDefinition: 'Showing a willingness to take surprisingly bold risks.', example: '« They made an audacious plan to scale the mountain. »' },
        { term: 'tranquility', partOfSpeech: 'noun', phonetic: '/træŋˈkwɪl.ə.ti/', baseDefinition: 'The quality or state of being tranquil; calm and peaceful.', example: '« The garden provided a haven of peace and tranquility. »' },
        { term: 'aesthetic', partOfSpeech: 'adjective', phonetic: '/esˈθet.ɪk/', baseDefinition: 'Concerned with beauty or the appreciation of beauty.', example: '« The building has great aesthetic appeal. »' },
        { term: 'euphoria', partOfSpeech: 'noun', phonetic: '/juːˈfɔː.ri.ə/', baseDefinition: 'A feeling or state of intense excitement and happiness.', example: '« They were in a state of euphoria after winning the championship. »' },
        { term: 'scrutinize', partOfSpeech: 'verb', phonetic: '/ˈskruː.tɪ.naɪz/', baseDefinition: 'Examine or inspect closely and thoroughly.', example: '« Customers were urged to scrutinize the fine print of the contract. »' },
        { term: 'mandatory', partOfSpeech: 'adjective', phonetic: '/ˈmæn.də.tər.i/', baseDefinition: 'Required by law or rules; compulsory.', example: '« Attendance at the orientation meeting is mandatory. »' },
        { term: 'lucrative', partOfSpeech: 'adjective', phonetic: '/ˈluː.krə.tɪv/', baseDefinition: 'Producing a great deal of profit.', example: '« She started a lucrative consulting business. »' },
        { term: 'unprecedented', partOfSpeech: 'adjective', phonetic: '/ʌnˈpres.ɪ.den.tɪd/', baseDefinition: 'Never done or known before.', example: '« The team achieved an unprecedented victory. »' },
        { term: 'coherent', partOfSpeech: 'adjective', phonetic: '/kəʊˈhɪə.rənt/', baseDefinition: 'Logical and consistent, clear and easy to understand.', example: '« He presented a coherent argument for the new proposal. »' },
        { term: 'tangible', partOfSpeech: 'adjective', phonetic: '/ˈtæn.dʒə.bəl/', baseDefinition: 'Perceptible by touch; clear and definite.', example: '« The policy produced tangible benefits for students. »' },
        { term: 'indispensable', partOfSpeech: 'adjective', phonetic: '/ˌɪn.dɪˈspen.sə.bəl/', baseDefinition: 'Absolutely necessary; essential.', example: '« A good dictionary is indispensable for learning a new language. »' },
        { term: 'sporadic', partOfSpeech: 'adjective', phonetic: '/spəˈræd.ɪk/', baseDefinition: 'Occurring at irregular intervals or only in a few places; scattered.', example: '« The city experienced sporadic rainfall throughout the day. »' },
        { term: 'ambiguous', partOfSpeech: 'adjective', phonetic: '/æmˈbɪɡ.ju.əs/', baseDefinition: 'Open to more than one interpretation; having a double meaning.', example: '« The instructions were ambiguous and led to confusion. »' },
        { term: 'foster', partOfSpeech: 'verb', phonetic: '/ˈfɒs.tər/', baseDefinition: 'Encourage or promote the development of something.', example: '« Teachers work to foster creativity in young children. »' },
        { term: 'consolidate', partOfSpeech: 'verb', phonetic: '/kənˈsɒl.ɪ.deɪt/', baseDefinition: 'Make something physically stronger or more solid; combine into a single whole.', example: '« The company plans to consolidate its position in the market. »' },
      ],
      fr: [
        { term: 'résilience', partOfSpeech: 'noun', phonetic: '/re.zi.ljɑ̃s/', baseDefinition: 'Capacité à surmonter les épreuves et les difficultés de la vie.', example: '« Sa résilience face aux difficultés est admirable. »' },
        { term: 'flâner', partOfSpeech: 'verb', phonetic: '/fla.ne/', baseDefinition: 'Se promener lentement et sans repère précis, en prenant son temps.', example: '« J’aime flâner dans les rues de Paris. »' },
        { term: 'bienveillance', partOfSpeech: 'noun', phonetic: '/bjɛ̃.vɛ.jɑ̃s/', baseDefinition: 'Disposition d’esprit inclinant à la compréhension et à la bonté envers autrui.', example: '« Il traite chacun avec une grande bienveillance. »' },
        { term: 'éphémère', partOfSpeech: 'adjective', phonetic: '/e.fe.mɛʁ/', baseDefinition: 'Qui dure très peu de temps, passager et fugace.', example: '« La beauté de cette fleur est éphémère. »' },
        { term: 'dépaysement', partOfSpeech: 'noun', phonetic: '/de.pe.iz.mɑ̃/', baseDefinition: 'Changement d’habitudes et sensation de nouveauté liée à un nouvel environnement.', example: '« Voyager offre un réel dépaysement. »' },
        { term: 'savoir-faire', partOfSpeech: 'noun', phonetic: '/sa.vwaʁ.fɛʁ/', baseDefinition: 'Compétence pratique et expérience acquise dans une activité précise.', example: '« Ce produit reflète un savoir-faire d’exception. »' },
        { term: 'retrouvailles', partOfSpeech: 'noun', phonetic: '/ʁə.tʁu.vaj/', baseDefinition: 'Fait de se retrouver après une longue période de séparation.', example: '« Nos retrouvailles ont été chaleureuses et émouvantes. »' },
        { term: 'épanouissement', partOfSpeech: 'noun', phonetic: '/e.pa.nwi.smɑ̃/', baseDefinition: 'Développement complet et harmonieux de ses facultés.', example: '« La passion pour les langues favorise l’épanouissement personnel. »' },
        { term: 'insolite', partOfSpeech: 'adjective', phonetic: '/ɛ̃.sɔ.lit/', baseDefinition: 'Qui surprend par son caractère inhabituel et original.', example: '« Nous avons découvert un endroit insolite au cœur de la ville. »' },
        { term: 'sérénité', partOfSpeech: 'noun', phonetic: '/se.ʁe.ni.te/', baseDefinition: 'État de calme paisible et d’esprit dégagé de tout souci.', example: '« Il aborde les examens avec sérénité et confiance. »' },
        { term: 'émerveillement', partOfSpeech: 'noun', phonetic: '/e.mɛʁ.vɛj.mɑ̃/', baseDefinition: 'Sentiment d’admiration mêlé de surprise et de joie intense.', example: '« Le paysage suscite un émerveillement immédiat. »' },
        { term: 'clairvoyance', partOfSpeech: 'noun', phonetic: '/klɛʁ.vwa.jɑ̃s/', baseDefinition: 'Faculté de comprendre clairement et rapidement les choses.', example: '« Sa clairvoyance a permis d’éviter de nombreuses erreurs. »' },
        { term: 'épicurien', partOfSpeech: 'noun', phonetic: '/e.pi.ky.ʁjɛ̃/', baseDefinition: 'Personne qui sait apprécier les plaisirs simples và authentiques de la vie.', example: '« C’est un vrai épicurien qui aime la bonne cuisine. »' },
        { term: 'complicité', partOfSpeech: 'noun', phonetic: '/kɔ̃.pli.si.te/', baseDefinition: 'Entente profonde et chaleureuse entre deux personnes.', example: '« Une belle complicité règne dans l’équipe. »' },
        { term: 'enthousiasme', partOfSpeech: 'noun', phonetic: '/ɑ̃.tu.zjasm/', baseDefinition: 'Émotion vive poussant à l’action avec joie.', example: '« Elle apprend le français avec un grand enthousiasme. »' },
        { term: 'lueur', partOfSpeech: 'noun', phonetic: '/lɥœʁ/', baseDefinition: 'Lumière faible mais bien visible dans l’obscurité.', example: '« Une lueur d’espoir éclaire son visage. »' },
        { term: 'métamorphose', partOfSpeech: 'noun', phonetic: '/me.ta.mɔʁ.foz/', baseDefinition: 'Changement complet et remarquable de forme ou d’état.', example: '« La ville a connu une véritable métamorphose. »' },
        { term: 'nostalgie', partOfSpeech: 'noun', phonetic: '/nɔs.tal.ʒi/', baseDefinition: 'Regret mélancolique d’un temps passé ou d’un pays distant.', example: '« Les souvenirs d’enfance apportent une douce nostalgie. »' },
        { term: 'passion', partOfSpeech: 'noun', phonetic: '/pa.sjɔ̃/', baseDefinition: 'Affection vive et motivante pour une activité.', example: '« La musique est sa plus grande passion. »' },
        { term: 'renaissance', partOfSpeech: 'noun', phonetic: '/ʁə.nɛ.sɑ̃s/', baseDefinition: 'Nouveau départ et renouveau d’énergie.', example: '« Le printemps marque la renaissance de la nature. »' },
        { term: 'solidarité', partOfSpeech: 'noun', phonetic: '/sɔ.li.da.ʁi.te/', baseDefinition: 'Entraide mutuelle entre les membres d’un groupe.', example: '« La solidarité fait la force de notre communauté. »' },
        { term: 'tendresse', partOfSpeech: 'noun', phonetic: '/tɑ̃.dʁɛs/', baseDefinition: 'Sentiment d’affection douce et attentionnée.', example: '« Il la regarde avec beaucoup de tendresse. »' },
      ],
      es: [
        { term: 'querencia', partOfSpeech: 'noun', phonetic: '/ke.ˈɾen.sja/', baseDefinition: 'A place where one feels safe, grounded, and at home.', example: '« Regresar a casa era su querencia. »' },
        { term: 'sobremesa', partOfSpeech: 'noun', phonetic: '/so.βɾe.ˈme.sa/', baseDefinition: 'The time spent relaxing and chatting around the table after a meal.', example: '« Disfrutamos de una larga sobremesa. »' },
        { term: 'empatía', partOfSpeech: 'noun', phonetic: '/em.pa.ˈti.a/', baseDefinition: 'Capacidad de comprender y compartir los sentimientos de los demás.', example: '« La empatía es fundamental en nuestras relaciones. »' },
        { term: 'resiliencia', partOfSpeech: 'noun', phonetic: '/re.si.ˈljen.sja/', baseDefinition: 'Capacidad de adaptación frente a un agente perturbador o una situación adversa.', example: '« Demostró gran resiliencia ante los problemas. »' },
        { term: 'atardecer', partOfSpeech: 'noun', phonetic: '/a.taʁ.ðe.ˈseʁ/', baseDefinition: 'Caída de la tarde o momento en que se pone el sol.', example: '« Contemplamos un hermoso atardecer en la playa. »' },
        { term: 'esperanza', partOfSpeech: 'noun', phonetic: '/es.pe.ˈɾan.sa/', baseDefinition: 'Confianza de lograr lo que se desea o de que ocurra algo positivo.', example: '« Mantiene viva la esperanza de superación. »' },
        { term: 'mariposa', partOfSpeech: 'noun', phonetic: '/ma.ɾi.ˈpo.sa/', baseDefinition: 'Insecto de alas coloridas símbolo de transformación.', example: '« Una hermosa mariposa revolotea en el jardín. »' },
        { term: 'alegría', partOfSpeech: 'noun', phonetic: '/a.le.ˈɣɾi.a/', baseDefinition: 'Sentimiento de dicha, gozo y animación.', example: '« Su sonrisa contagia alegría a todos. »' },
        { term: 'amistad', partOfSpeech: 'noun', phonetic: '/a.mis.ˈtað/', baseDefinition: 'Afecto personal, puro y compartido con otra persona.', example: '« Valoramos la verdadera amistad por encima de todo. »' },
        { term: 'abrazo', partOfSpeech: 'noun', phonetic: '/a.ˈβɾa.so/', baseDefinition: 'Muestra de cariño que consiste en ceñir con los brazos.', example: '« Se dieron un fuerte abrazo de bienvenida. »' },
        { term: 'camino', partOfSpeech: 'noun', phonetic: '/ka.ˈmi.no/', baseDefinition: 'Vía para viajar y avanzar hacia una meta.', example: '« Cada paso te acerca más a tu camino deseado. »' },
        { term: 'destello', partOfSpeech: 'noun', phonetic: '/des.ˈte.ʎo/', baseDefinition: 'Resplandor vivo y ráfaga de luz efímera.', example: '« Un destello de inspiración iluminó su mente. »' },
        { term: 'ilusión', partOfSpeech: 'noun', phonetic: '/i.lu.ˈsjon/', baseDefinition: 'Esperanza o anhelo de lograr algo muy deseado.', example: '« Inicia su nuevo proyecto con gran ilusión. »' },
        { term: 'libertad', partOfSpeech: 'noun', phonetic: '/li.βeɾ.ˈtað/', baseDefinition: 'Facultad de actuar según la propia voluntad y convicción.', example: '« La educación abre las puertas a la libertad. »' },
        { term: 'melancolía', partOfSpeech: 'noun', phonetic: '/me.laŋ.ko.ˈli.a/', baseDefinition: 'Tristeza suave y vaga reflejada en el recuerdo.', example: '« La lluvia suave le produce cierta melancolía. »' },
        { term: 'refugio', partOfSpeech: 'noun', phonetic: '/re.ˈfu.xjo/', baseDefinition: 'Lugar seguro de paz y tranquilidad.', example: '« Su hogar es un cálido refugio de paz. »' },
        { term: 'serenidad', partOfSpeech: 'noun', phonetic: '/se.ɾe.ni.ˈðað/', baseDefinition: 'Estado de calma y sosiego en la mente.', example: '« Afronta los retos diarios con serenidad. »' },
        { term: 'valiente', partOfSpeech: 'adjective', phonetic: '/ba.ˈljen.te/', baseDefinition: 'Persona decidida que enfrenta los miedos con coraje.', example: '« Es una persona valiente que nunca se rinde. »' },
      ],
      de: [
        { term: 'Feierabend', partOfSpeech: 'noun', phonetic: '/ˈfaɪ̯ɐˌʔaːbn̩t/', baseDefinition: 'The relaxing time at the end of the working day.', example: '« Schönen Feierabend allerseits! »' },
        { term: 'Fernweh', partOfSpeech: 'noun', phonetic: '/ˈfɛʁnˌveː/', baseDefinition: 'A longing for far-off places; wanderlust.', example: '« Ich habe großes Fernweh nach dem Meer. »' },
        { term: 'Gemütlichkeit', partOfSpeech: 'noun', phonetic: '/ɡəˈmyːtlɪçkaɪt/', baseDefinition: 'State of warmth, friendliness, and cozy comfort.', example: '« Das Wohnzimmer strahlt echte Gemütlichkeit aus. »' },
        { term: 'Vorfreude', partOfSpeech: 'noun', phonetic: '/ˈfoːɐ̯ˌfʁɔɪ̯də/', baseDefinition: 'Joyful anticipation of something good to come.', example: '« Die Vorfreude auf die Reise ist riesengroß. »' },
        { term: 'Zuversicht', partOfSpeech: 'noun', phonetic: '/ˈtsuːfɛɐ̯zɪçt/', baseDefinition: 'Firm belief in a positive outcome; confidence.', example: '« Er blickt voller Zuversicht in die Zukunft. »' },
        { term: 'Wanderlust', partOfSpeech: 'noun', phonetic: '/ˈvan.dɐ.lʊst/', baseDefinition: 'Strong desire to travel and explore the world.', example: '« Die Wanderlust treibt ihn in ferne Länder. »' },
        { term: 'Geborgenheit', partOfSpeech: 'noun', phonetic: '/ɡəˈbɔʁɡn̩haɪt/', baseDefinition: 'Feeling of warm security, protection, and trust.', example: '« Bei der Familie spürt man echte Geborgenheit. »' },
        { term: 'Sehnsucht', partOfSpeech: 'noun', phonetic: '/ˈzeːnˌzʊxt/', baseDefinition: 'Deep longing or yearning of the heart.', example: '« Eine stille Sehnsucht erfüllt sein Herz. »' },
        { term: 'Augenblick', partOfSpeech: 'noun', phonetic: '/ˈaʊ̯ɡn̩ˌblɪk/', baseDefinition: 'Precious fleeting moment in time.', example: '« Genieße den gegenwärtigen Augenblick! »' },
        { term: 'Dankbarkeit', partOfSpeech: 'noun', phonetic: '/ˈdaŋkbaːɐ̯kaɪt/', baseDefinition: 'Sincere feeling of gratitude and appreciation.', example: '« Dankbarkeit bringt Freude ins Leben. »' },
        { term: 'Freiheit', partOfSpeech: 'noun', phonetic: '/ˈfʁaɪ̯haɪt/', baseDefinition: 'State of freedom and personal liberty.', example: '« Die Freiheit der Gedanken ist unantastbar. »' },
        { term: 'Lebensfreude', partOfSpeech: 'noun', phonetic: '/ˈleːbn̩sˌfʁɔɪ̯də/', baseDefinition: 'Zest for life and joyful living.', example: '« Ihre strahlende Lebensfreude steckt alle an. »' },
        { term: 'Traum', partOfSpeech: 'noun', phonetic: '/tʁaʊ̯m/', baseDefinition: 'Dream, hope, and vision for the future.', example: '« Verfolge deinen Traum mit ganzer Kraft. »' },
        { term: 'Vertrauen', partOfSpeech: 'noun', phonetic: '/fɛɐ̯ˈtʁaʊ̯ən/', baseDefinition: 'Trust, faith, and confidence in someone.', example: '« Vertrauen ist das Fundament jeder Freundschaft. »' },
        { term: 'Zusammenhalt', partOfSpeech: 'noun', phonetic: '/tsuˈzamənˌhalt/', baseDefinition: 'Solidarity, cohesion, and unity in a team.', example: '« Der Zusammenhalt im Team stärkt alle. »' },
      ],
      ja: [
        { term: '木漏れ日', partOfSpeech: 'noun', phonetic: '/ko.mo.re.bi/', baseDefinition: 'Sunlight filtering through trees and foliage.', example: '« 森の中で綺麗な木漏れ日を見た。 »' },
        { term: '一期一会', partOfSpeech: 'noun', phonetic: '/i.tʃi.ɡo i.tʃi.e/', baseDefinition: 'Treasure every encounter, for it will never recur.', example: '« 人との出会いを一期一会として大切にする。 »' },
        { term: '生き甲斐', partOfSpeech: 'noun', phonetic: '/i.ki.ga.i/', baseDefinition: 'A reason for being; that which gives life purpose and fulfillment.', example: '« 毎日の言語学習が私の生き甲斐です。 »' },
        { term: '侘寂', partOfSpeech: 'noun', phonetic: '/wa.bi sa.bi/', baseDefinition: 'Appreciating beauty that is imperfect, impermanent, and incomplete.', example: '« 日本の伝統美には侘寂の心がある。 »' },
        { term: '森林浴', partOfSpeech: 'noun', phonetic: '/si.n-ri-n-yo-ku/', baseDefinition: 'Forest bathing; taking in the atmosphere of the forest for health.', example: '« 週末に森で森林浴を楽しんだ。 »' },
        { term: '幽玄', partOfSpeech: 'noun', phonetic: '/yuu.ge.n/', baseDefinition: 'A profound, mysterious grace and subtle elegance.', example: '« 能楽の舞台には幽玄の美が漂っている。 »' },
        { term: '物の哀れ', partOfSpeech: 'noun', phonetic: '/mo.no no a.wa.re/', baseDefinition: 'An awareness of the impermanence of things and a gentle sadness at their passing.', example: '« 散る桜に物の哀れを感じる。 »' },
        { term: '浮世', partOfSpeech: 'noun', phonetic: '/u.ki.yo/', baseDefinition: 'The floating, fleeting world of transient pleasures.', example: '« 江戸時代の浮世絵は人々の暮らしを描いている。 »' },
        { term: '懐かしい', partOfSpeech: 'adjective', phonetic: '/na.tsu.ka.shi.i/', baseDefinition: 'Bringing back fond memories of the past; nostalgic.', example: '« 故郷の歌を聴くととても懐かしい。 »' },
        { term: '絆', partOfSpeech: 'noun', phonetic: '/ki.tsu.na/', baseDefinition: 'Emotional bonds and ties connecting people together.', example: '« 家族や友人との強い絆を大切にする。 »' },
        { term: '桜', partOfSpeech: 'noun', phonetic: '/sa.ku.ra/', baseDefinition: 'Cherry blossom, symbolizing spring and new beginnings.', example: '« 春になると満開の桜が街を彩る。 »' },
        { term: '花火', partOfSpeech: 'noun', phonetic: '/ha.na.bi/', baseDefinition: 'Fireworks display illuminating the summer sky.', example: '« 夏祭り夜空に綺麗な花火が上がった。 »' },
        { term: '風鈴', partOfSpeech: 'noun', phonetic: '/fuu.ri.n/', baseDefinition: 'Japanese wind chime creating refreshing summer sounds.', example: '« 軒下で風鈴が涼しげな音を奏でる。 »' },
        { term: '雨宿り', partOfSpeech: 'noun', phonetic: '/a.ma.ya.do.ri/', baseDefinition: 'Taking shelter from the rain under an eve or porch.', example: '« 突然の雨でバス停で雨宿りをした。 »' },
        { term: '縁側', partOfSpeech: 'noun', phonetic: '/e.n.ga.wa/', baseDefinition: 'Traditional Japanese wooden porch along the house garden.', example: '« 晴れた日に縁側でお茶を飲むのが好きだ。 »' },
        { term: '憧れ', partOfSpeech: 'noun', phonetic: '/a.ko.ga.re/', baseDefinition: 'Yearning, admiration, and aspiration towards a goal.', example: '« 彼女は私の憧れの先輩です。 »' },
        { term: '勇気', partOfSpeech: 'noun', phonetic: '/yuu.ki/', baseDefinition: 'Courage and bravery to face challenges.', example: '« 新しい一歩を踏み出す勇気を持つ。 »' },
        { term: '希望', partOfSpeech: 'noun', phonetic: '/ki.ho.u/', baseDefinition: 'Hope and positive expectation for the future.', example: '« 明り未来への希望を胸に抱く。 »' },
        { term: '感謝', partOfSpeech: 'noun', phonetic: '/ka.n.sha/', baseDefinition: 'Sincere gratitude and appreciation.', example: '« いつも支えてくれる人に感謝する。 »' },
        { term: '平和', partOfSpeech: 'noun', phonetic: '/he.i.wa/', baseDefinition: 'Peace, harmony, and tranquility.', example: '« 世界の平和と幸せを祈る。 »' },
        { term: '努力', partOfSpeech: 'noun', phonetic: '/do.ryo.ku/', baseDefinition: 'Continuous effort, hard work, and dedication.', example: '« 毎日の努力が素晴らしい成果を結ぶ。 »' },
        { term: '改善', partOfSpeech: 'noun', phonetic: '/ka.i.ze.n/', baseDefinition: 'Continuous improvement and positive change.', example: '« 業務の効率化に向けて改善を重ねる。 »' },
        { term: '旅人', partOfSpeech: 'noun', phonetic: '/ta.bi.bi.to/', baseDefinition: 'Traveler or wanderer journeying across places.', example: '« 旅人は未知の景色を求めて歩き続ける。 »' },
        { term: '青空', partOfSpeech: 'noun', phonetic: '/ao.zo.ra/', baseDefinition: 'Clear blue sky symbolizing brightness.', example: '« 澄み切った青空が気持ちよく広がっている。 »' },
        { term: 'ほっこり', partOfSpeech: 'adjective', phonetic: '/ho.k-ko.ri/', baseDefinition: 'Warm, cozy, and comforting feeling in one’s heart.', example: '« 温かいスープを飲んで心がほっこりした。 »' },
        { term: '奇跡', partOfSpeech: 'noun', phonetic: '/ki.se.ki/', baseDefinition: 'Miracle or extraordinary event.', example: '« 諦めなかったことで奇跡が起きた。 »' },
        { term: '笑顔', partOfSpeech: 'noun', phonetic: '/e.ga.o/', baseDefinition: 'Bright smiling face filled with happiness.', example: '« 彼女の明るい笑顔は周りを元気にする。 »' },
        { term: '桜吹雪', partOfSpeech: 'noun', phonetic: '/sa.ku.ra.fu.bu.ki/', baseDefinition: 'Blizzard of falling cherry blossom petals in the wind.', example: '« 風が吹くと美しい桜吹雪が舞った。 »' },
        { term: '葛藤', partOfSpeech: 'noun', phonetic: '/ka.t-to.u/', baseDefinition: 'Internal conflict or struggle between choices.', example: '« 夢と現実の間で大きな葛藤を経験した。 »' },
        { term: '猫舌', partOfSpeech: 'noun', phonetic: '/ne.ko.ji.ta/', baseDefinition: 'Inability to eat or drink hot things (cat tongue).', example: '« 私は猫舌なので熱いお茶は少し冷まして飲む。 »' },
        { term: '音色', partOfSpeech: 'noun', phonetic: '/ne.i.ro/', baseDefinition: 'Tone quality or gentle sound timbre of music.', example: '« ピアノの美しい音色が部屋に響き渡る。 »' },
      ],
      ko: [
        { term: '설레다', partOfSpeech: 'verb', phonetic: '/seol.re.da/', baseDefinition: 'To flutter or feel thrilling excitement in one’s heart.', example: '« 새로운 시작을 앞두고 마음이 설레다. »' },
        { term: '소소하다', partOfSpeech: 'adjective', phonetic: '/so.so.ha.da/', baseDefinition: 'Small, simple, and cozy happiness or detail.', example: '« 소소한 행복을 느끼며 살고 싶다. »' },
        { term: '정', partOfSpeech: 'noun', phonetic: '/jeong/', baseDefinition: 'Warm affection, bonding, and deep human connection.', example: '« 한국 사람들은 정이 많다. »' },
        { term: '눈치', partOfSpeech: 'noun', phonetic: '/nun.chi/', baseDefinition: 'Social tact and quick ability to sense others’ moods and situations.', example: '« 그 사람은 눈치가 빠르다. »' },
        { term: '따뜻하다', partOfSpeech: 'adjective', phonetic: '/tta.ttu.tha.da/', baseDefinition: 'Warm and cozy in heart or temperature.', example: '« 따뜻한 차 한 잔을 마시며 쉰다. »' },
        { term: '행복', partOfSpeech: 'noun', phonetic: '/haeng.bok/', baseDefinition: 'State of happiness, joy, and emotional contentment.', example: '« 일상의 작은 것에서 행복을 찾는다. »' },
        { term: '추억', partOfSpeech: 'noun', phonetic: '/chu.eok/', baseDefinition: 'Cherished memories of past experiences.', example: '« 친구들과 아름다운 추억을 만들었다. »' },
        { term: '인연', partOfSpeech: 'noun', phonetic: '/in.yeon/', baseDefinition: 'Serendipitous connection or ties connecting people.', example: '« 소중한 인연에 감사하는 마음을 갖는다. »' },
        { term: '하늘', partOfSpeech: 'noun', phonetic: '/ha.neul/', baseDefinition: 'Clear sky above symbolizing vastness.', example: '« 파란 하늘을 바라보며 마음을 가다듬는다. »' },
        { term: '바람', partOfSpeech: 'noun', phonetic: '/ba.ram/', baseDefinition: 'Refreshing breeze or heartfelt wish.', example: '« 시원한 바람이 불어 기분이 좋아진다. »' },
        { term: '미소', partOfSpeech: 'noun', phonetic: '/mi.so/', baseDefinition: 'Warm gentle smile expressing affection.', example: '« 그의 밝은 미소가 주변을 환하게 한다. »' },
        { term: '희망', partOfSpeech: 'noun', phonetic: '/hui.mang/', baseDefinition: 'Hope and bright anticipation of tomorrow.', example: '« 어떤 어려움 속에서도 희망을 잃지 않는다. »' },
        { term: '용기', partOfSpeech: 'noun', phonetic: '/yong.gi/', baseDefinition: 'Courage to take bold steps forward.', example: '« 새로운 도전을 위해 용기를 낸다. »' },
        { term: '감사', partOfSpeech: 'noun', phonetic: '/gam.sa/', baseDefinition: 'Heartfelt appreciation and gratitude.', example: '« 도와준 분들에게 진심으로 감사를 전한다. »' },
        { term: '평화', partOfSpeech: 'noun', phonetic: '/pyeong.hwa/', baseDefinition: 'Peace and tranquil quietness.', example: '« 조용한 숲길에서 마음의 평화를 느낀다. »' },
        { term: '노력', partOfSpeech: 'noun', phonetic: '/no.ryeok/', baseDefinition: 'Continuous hard work and endeavor.', example: '« 꾸준한 노력은 결코 배신하지 않는다. »' },
        { term: '낭만', partOfSpeech: 'noun', phonetic: '/nang.man/', baseDefinition: 'Romance and poetic emotional vibe.', example: '« 밤바다를 거닐며 낭만을 즐긴다. »' },
        { term: '여운', partOfSpeech: 'noun', phonetic: '/yeo.un/', baseDefinition: 'Lingering impression or heartwarming afterglow.', example: '« 감동적인 영화가 긴 여운을 남겼다. »' },
      ],
      zh: [
        { term: '缘分', partOfSpeech: 'noun', phonetic: '/yuán fèn/', baseDefinition: 'Fate or serendipitous connection bringing people together.', example: '« 我们能在这里相遇真是很有缘分。 »' },
        { term: '加油', partOfSpeech: 'verb', phonetic: '/jiā yóu/', baseDefinition: 'To make an extra effort; cheer on!', example: '« 考试加油，你一定可以的！ »' },
        { term: '沉淀', partOfSpeech: 'verb', phonetic: '/chén diàn/', baseDefinition: 'To accumulate and settle knowledge or experience over time.', example: '« 学习需要时间的沉淀。 »' },
        { term: '珍重', partOfSpeech: 'verb', phonetic: '/zhēn zhòng/', baseDefinition: 'To value, treasure, and take good care of oneself.', example: '« 朋友，请多多珍重。 »' },
        { term: '小確幸', partOfSpeech: 'noun', phonetic: '/xiǎo què xìng/', baseDefinition: 'Small but definite happiness in everyday life.', example: '« 喝一杯热咖啡是生活中的小确幸。 »' },
        { term: '歲月', partOfSpeech: 'noun', phonetic: '/suì yuè/', baseDefinition: 'Years and flow of time passing gracefully.', example: '« 岁月如歌，珍视当下的每一刻。 »' },
        { term: '美好', partOfSpeech: 'adjective', phonetic: '/měi hǎo/', baseDefinition: 'Beautiful, fine, and wonderful quality.', example: '« 祝福你拥有美好的未来。 »' },
        { term: '溫暖', partOfSpeech: 'adjective', phonetic: '/wēn nuǎn/', baseDefinition: 'Warm and cozy in heart or atmosphere.', example: '« 大家的关怀让人感到无比温暖。 »' },
        { term: '星空', partOfSpeech: 'noun', phonetic: '/xīng kōng/', baseDefinition: 'Starry night sky full of wonder.', example: '« 仰望夜晚璀璨的星空。 »' },
        { term: '遇見', partOfSpeech: 'verb', phonetic: '/yù jiàn/', baseDefinition: 'To encounter and meet someone special.', example: '« 很高兴在最美的时光遇见你。 »' },
        { term: '珍惜', partOfSpeech: 'verb', phonetic: '/zhēn xī/', baseDefinition: 'To cherish, value, and treasure every moment.', example: '« 珍惜身边的每个人与每一段时光。 »' },
        { term: '勇氣', partOfSpeech: 'noun', phonetic: '/yǒng qì/', baseDefinition: 'Courage and bravery to pursue dreams.', example: '« 勇敢面对挑战需要坚定的勇气。 »' },
        { term: '夢想', partOfSpeech: 'noun', phonetic: '/mèng xiǎng/', baseDefinition: 'Dream, goal, and cherished ambition.', example: '« 只要努力，梦想终会实现。 »' },
        { term: '寧靜', partOfSpeech: 'noun', phonetic: '/níng jìng/', baseDefinition: 'Tranquility, quietness, and inner peace.', example: '« 清晨的湖畔充满了宁静。 »' },
        { term: '青春', partOfSpeech: 'noun', phonetic: '/qīng chūn/', baseDefinition: 'Youth and vibrant springtime of life.', example: '« 青春是一段充满无限可能的旅程。 »' },
        { term: '初心的', partOfSpeech: 'noun', phonetic: '/chū xīn/', baseDefinition: 'Original intention and aspiring heart at start.', example: '« 不忘初心，方得始终。 »' },
        { term: '璀璨', partOfSpeech: 'adjective', phonetic: '/cuǐ càn/', baseDefinition: 'Resplendent, brilliant, and shining bright.', example: '« 绽放如烟花般璀璨的人生。 »' },
      ],
      vi: [
        { term: 'thương nhớ', partOfSpeech: 'verb', phonetic: '/tʰɨəŋ ɲə́/', baseDefinition: 'Tình cảm nhớ nhung tha thiết dành cho người thân yêu.', example: '« Anh luôn thương nhớ về quê hương. »' },
        { term: 'an nhiên', partOfSpeech: 'adjective', phonetic: '/aːn ɲiən/', baseDefinition: 'Thái độ sống thong dong, bình yên, không vướng bận ưu phiền.', example: '« Mong bạn luôn an nhiên giữa sóng gió cuộc đời. »' },
        { term: 'hoài niệm', partOfSpeech: 'noun', phonetic: '/hwaːj niəm/', baseDefinition: 'Nhớ lại những kỷ niệm đẹp đẽ đã qua trong quá khứ.', example: '« Bài hát cũ gợi lại bao hoài niệm tuổi học trò. »' },
        { term: 'yên bình', partOfSpeech: 'adjective', phonetic: '/ieŋ ɓiŋ/', baseDefinition: 'Cảm giác êm đềm, không lo âu hay xáo trộn.', example: '« Ngôi làng nhỏ giữ nguyên vẻ yên bình vốn có. »' },
        { term: 'đong đầy', partOfSpeech: 'adjective', phonetic: '/ɗawŋ ɗəj/', baseDefinition: 'Tràn ngập tình cảm yêu thương và trọn vẹn.', example: '« Ánh mắt đong đầy niềm vui và hạnh phúc. »' },
        { term: 'vấn vương', partOfSpeech: 'verb', phonetic: '/və́n vɨəŋ/', baseDefinition: 'Lưu luyến, vương vấn không lỡ rời xa.', example: '« Cơn mưa chiều để lại bao vấn vương. »' },
        { term: 'chân thành', partOfSpeech: 'adjective', phonetic: '/tɕən tʰəjŋ/', baseDefinition: 'Thật thà, xuất phát từ đáy lòng không dối gian.', example: '« Tình cảm chân thành luôn chạm đến trái tim. »' },
        { term: 'thanh xuân', partOfSpeech: 'noun', phonetic: '/tʰəjŋ swən/', baseDefinition: 'Tuổi trẻ tươi đẹp và nhiều hoài bão rực rỡ.', example: '« Thanh xuân là những năm tháng đáng nhớ nhất. »' },
        { term: 'gắn kết', partOfSpeech: 'verb', phonetic: '/ɣən ket/', baseDefinition: 'Gắn bó chặt chẽ và kết nối sâu sắc.', example: '« Sự sẻ chia giúp các thành viên thêm gắn kết. »' },
        { term: 'hy vọng', partOfSpeech: 'noun', phonetic: '/hi vawŋ/', baseDefinition: 'Niềm tin vào những điều tốt đẹp sắp tới.', example: '« Luôn giữ vững ngọn lửa hy vọng trong tim. »' },
        { term: 'rực rỡ', partOfSpeech: 'adjective', phonetic: '/zɨk zə́/', baseDefinition: 'Tươi sáng, lấp lánh và tràn đầy năng lượng.', example: '« Nụ cười rực rỡ đón chào ngày mới. »' },
        { term: 'diệu kỳ', partOfSpeech: 'adjective', phonetic: '/zieu ki/', baseDefinition: 'Kỳ diệu và mang lại cảm giác bất ngờ đẹp đẽ.', example: '« Cuộc sống chứa đựng muôn vàn điều diệu kỳ. »' },
        { term: 'ngọt ngào', partOfSpeech: 'adjective', phonetic: '/ŋɔt ŋaːw/', baseDefinition: 'Êm dịu, mang lại cảm xúc hạnh phúc.', example: '« Lời chúc ngọt ngào xua tan bao mệt mỏi. »' },
        { term: 'bao dung', partOfSpeech: 'adjective', phonetic: '/ɓaːw zuŋ/', baseDefinition: 'Rộng lượng, sẵn sàng cảm thông và thứ lỗi.', example: '« Lòng bao dung làm cho tâm hồn thanh thản. »' },
        { term: 'thấu hiểu', partOfSpeech: 'verb', phonetic: '/tʰə́w hiəw/', baseDefinition: 'Hiểu rõ và cảm nhận sâu sắc suy nghĩ người khác.', example: '« Sự thấu hiểu là chìa khóa của tình bạn. »' },
        { term: 'kiên cường', partOfSpeech: 'adjective', phonetic: '/kieŋ kɨəŋ/', baseDefinition: 'Mạnh mẽ, vững vàng vượt qua khó khăn.', example: '« Tinh thần kiên cường đối mặt thử thách. »' },
        { term: 'tỏa sáng', partOfSpeech: 'verb', phonetic: '/twaː saːŋ/', baseDefinition: 'Bộc lộ tài năng và vẻ đẹp rạng rỡ.', example: '« Bạn luôn có thể tỏa sáng theo cách của riêng mình. »' },
      ],
    };

    const pool = CURATED_POOLS[targetLang] || CURATED_POOLS['en'];

    const wordList: Array<{
      term: string;
      partOfSpeech: string;
      phonetic: string;
      baseDefinition: string;
      example: string;
    }> = [...pool];

    // Lấy thêm từ ngẫu nhiên từ API 3rd-party cho tiếng Anh (Datamuse API / Random Word API)
    if (targetLang === 'en') {
      try {
        const randomWords = await this.dictionaryService.fetchRandomWords('en', 5);
        for (const rw of randomWords) {
          if (!wordList.some((w) => w.term.toLowerCase() === rw)) {
            wordList.push({
              term: rw,
              partOfSpeech: 'noun',
              phonetic: '',
              baseDefinition: rw,
              example: '',
            });
          }
        }
      } catch {
        // ignore dynamic word fetch error
      }
    }

    if (langRecord) {
      const dbWords = await this.prisma.wordLibrary.findMany({
        where: { languageId: langRecord.id },
        take: 10,
        orderBy: { saveCount: 'desc' },
      });

      for (const w of dbWords) {
        if (!wordList.some((item) => item.term.toLowerCase() === w.term.toLowerCase())) {
          wordList.push({
            term: w.term,
            partOfSpeech: w.partOfSpeech || 'noun',
            phonetic: w.phonetic || '',
            baseDefinition: w.definition || w.term,
            example: w.example || '',
          });
        }
      }
    }

    let savedSet = new Set<string>();
    if (userId) {
      const userSaved = await this.prisma.userSavedWord.findMany({
        where: { userId },
        include: { word: true },
      });
      savedSet = new Set(userSaved.map((s) => s.word.term.toLowerCase()));
    }

    // Trộn ngẫu nhiên (Random Shuffle) danh sách từ vựng & chọn ngẫu nhiên 6 từ
    const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
    const selectedBatch = shuffledWords.slice(0, 6);

    const processedWords = await Promise.all(
      selectedBatch.map(async (item, index) => {
        let phonetic = item.phonetic;
        let baseDef = item.baseDefinition;
        let partOfSpeech = item.partOfSpeech;
        let example = item.example;
        let audioUrl: string | null = null;

        try {
          const dict = await this.dictionaryService.lookup(item.term, targetLang);
          if (dict) {
            if (dict.phonetic) phonetic = dict.phonetic;
            if (dict.partOfSpeech) partOfSpeech = dict.partOfSpeech;
            if (dict.definition && (!baseDef || baseDef === item.term)) {
              baseDef = dict.definition;
            }
            if (dict.example && (!example || example === '')) {
              example = dict.example;
            }
            if (dict.audioUrl) {
              audioUrl = dict.audioUrl;
            }
          }
        } catch {
          // ignore dictionary lookup error
        }

        let definition = baseDef;
        try {
          if (nativeLang) {
            const trans = await this.translateService.translate({
              text: baseDef,
              target: nativeLang,
              source: 'auto',
            });
            if (trans?.translation) {
              definition = trans.translation;
            }
          }
        } catch {
          definition = baseDef;
        }

        // Tự động lưu/cập nhật thông tin từ điển vào WordLibrary trong DB để nuôi dữ liệu DB tự động
        if (langRecord) {
          this.prisma.wordLibrary
            .upsert({
              where: {
                term_languageId: {
                  term: item.term,
                  languageId: langRecord.id,
                },
              },
              update: {
                phonetic: phonetic || undefined,
                partOfSpeech: partOfSpeech || undefined,
                definition: definition || undefined,
                example: example || undefined,
                audioUrl: audioUrl || undefined,
              },
              create: {
                term: item.term,
                languageId: langRecord.id,
                phonetic: phonetic || undefined,
                partOfSpeech: partOfSpeech || undefined,
                definition: definition || undefined,
                example: example || undefined,
                audioUrl: audioUrl || undefined,
                isPublic: true,
              },
            })
            .catch(() => {});
        }

        const posLabel = `${targetLang.toUpperCase()} ${partOfSpeech}`;

        return {
          index: index + 1,
          term: item.term,
          partOfSpeech: posLabel,
          phonetic: phonetic,
          definition: definition,
          example: example,
          audioUrl: audioUrl,
          isSaved: savedSet.has(item.term.toLowerCase()),
          languageId: langRecord?.id,
        };
      })
    );

    return {
      language: {
        code: targetLang,
        name: langRecord?.name || targetLang.toUpperCase(),
      },
      nativeLanguage: nativeLang,
      total: processedWords.length,
      words: processedWords,
    };
  }

  // Lấy danh sách đáp án nhiễu (distractor options) phong phú từ Free Dictionary API cho Quiz
  async getDistractors(targetCode?: string, nativeCode?: string) {
    let targetLang = targetCode?.trim().toLowerCase() || 'en';
    let nativeLang = nativeCode?.trim().toLowerCase() || 'vi';

    const pool = [
      'resilience', 'serendipity', 'ubiquitous', 'ephemeral', 'benevolent',
      'eloquent', 'pragmatic', 'perseverance', 'meticulous', 'enthusiasm',
      'solitude', 'nostalgia', 'luminous', 'compassion', 'versatile',
      'audacious', 'tranquility', 'aesthetic', 'euphoria', 'scrutinize',
      'mandatory', 'lucrative', 'unprecedented', 'coherent', 'tangible',
      'indispensable', 'sporadic', 'ambiguous', 'foster', 'consolidate',
    ];

    const LOCALIZED_FALLBACKS: Record<string, string[]> = {
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
        'Thực tế, logic và có tính ứng dụng cao',
        'Thái độ sống an nhiên, tự tại và bình yên',
        'Nghị lực sống phi thường và sự bền bỉ',
        'Niềm vui bất ngờ và sự may mắn tình cờ',
        'Sự chỉn chu, cẩn thận và tỉ mỉ trong từng chi tiết',
      ],
      fr: [
        "Dynamisme et énergie positive au quotidien",
        "Inspiration créative abondante et constante",
        "Capacité d'adaptation rapide aux nouvelles situations",
        "Persévérance remarquable et effort continu",
        "Empathie profonde et compréhension mutuelle",
        "Réussite et accomplissement exceptionnel",
        "Concentration soutenue et précision absolue",
        "Impact positif et durable sur l'environnement",
        "Esprit d'équipe chaleureux et convivialité",
        "Vision stratégique à long terme et perspicacité",
      ],
      en: [
        "Perseverance and continuous effort through challenges",
        "Abundant creative inspiration and innovative thinking",
        "Adaptability to new and complex environments",
        "Deep empathy and genuine mutual understanding",
        "Outstanding achievement and personal success",
        "High focus, clarity, and mental concentration",
        "Positive energy, enthusiasm, and warmth",
        "Strong, lasting, and meaningful impact",
      ],
    };

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedTerms = shuffled.slice(0, 10);

    const definitions = await Promise.all(
      selectedTerms.map(async (term) => {
        let baseDef = term;
        try {
          const dict = await this.dictionaryService.lookup(term, targetLang);
          if (dict?.definition) {
            baseDef = dict.definition;
          }
        } catch {
          // ignore lookup error
        }

        try {
          if (nativeLang && baseDef !== term) {
            const trans = await this.translateService.translate({
              text: baseDef,
              target: nativeLang,
              source: 'auto',
            });
            if (trans?.translation) {
              const result = trans.translation;
              if (nativeLang === 'vi' && /^[a-zA-Z0-9\s.,;:'"()\-«»]+$/.test(result.trim())) {
                return null;
              }
              return result;
            }
          }
        } catch {
          // ignore translate error
        }

        if (nativeLang === 'vi' && /^[a-zA-Z0-9\s.,;:'"()\-«»]+$/.test(baseDef.trim())) {
          return null;
        }

        return baseDef;
      })
    );

    const validDefs = definitions.filter((def): def is string => Boolean(def && def.length > 5));

    const fallbacks = LOCALIZED_FALLBACKS[nativeLang] || LOCALIZED_FALLBACKS['en'];
    const shuffledFallbacks = [...fallbacks].sort(() => Math.random() - 0.5);

    for (const fb of shuffledFallbacks) {
      if (validDefs.length < 10 && !validDefs.includes(fb)) {
        validDefs.push(fb);
      }
    }

    return validDefs;
  }
}
