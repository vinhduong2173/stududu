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
      ],
      es: [
        { term: 'querencia', partOfSpeech: 'noun', phonetic: '/ke.ˈɾen.sja/', baseDefinition: 'A place where one feels safe, grounded, and at home.', example: '« Regresar a casa era su querencia. »' },
        { term: 'sobremesa', partOfSpeech: 'noun', phonetic: '/so.βɾe.ˈme.sa/', baseDefinition: 'The time spent relaxing and chatting around the table after a meal.', example: '« Disfrutamos de una larga sobremesa. »' },
        { term: 'empatía', partOfSpeech: 'noun', phonetic: '/em.pa.ˈti.a/', baseDefinition: 'Capacidad de comprender y compartir los sentimientos de los demás.', example: '« La empatía es fundamental en nuestras relaciones. »' },
        { term: 'resiliencia', partOfSpeech: 'noun', phonetic: '/re.si.ˈljen.sja/', baseDefinition: 'Capacidad de adaptación frente a un agente perturbador o una situación adversa.', example: '« Demostró gran resiliencia ante los problemas. »' },
        { term: 'atardecer', partOfSpeech: 'noun', phonetic: '/a.taʁ.ðe.ˈseʁ/', baseDefinition: 'Caída de la tarde o momento en que se pone el sol.', example: '« Contemplamos un hermoso atardecer en la playa. »' },
        { term: 'esperanza', partOfSpeech: 'noun', phonetic: '/es.pe.ˈɾan.sa/', baseDefinition: 'Confianza de lograr lo que se desea o de que ocurra algo positivo.', example: '« Mantiene viva la esperanza de superación. »' },
      ],
      de: [
        { term: 'Feierabend', partOfSpeech: 'noun', phonetic: '/ˈfaɪ̯ɐˌʔaːbn̩t/', baseDefinition: 'The relaxing time at the end of the working day.', example: '« Schönen Feierabend allerseits! »' },
        { term: 'Fernweh', partOfSpeech: 'noun', phonetic: '/ˈfɛʁnˌveː/', baseDefinition: 'A longing for far-off places; wanderlust.', example: '« Ich habe großes Fernweh nach dem Meer. »' },
        { term: 'Gemütlichkeit', partOfSpeech: 'noun', phonetic: '/ɡəˈmyːtlɪçkaɪt/', baseDefinition: 'State of warmth, friendliness, and cozy comfort.', example: '« Das Wohnzimmer strahlt echte Gemütlichkeit aus. »' },
        { term: 'Vorfreude', partOfSpeech: 'noun', phonetic: '/ˈfoːɐ̯ˌfʁɔɪ̯də/', baseDefinition: 'Joyful anticipation of something good to come.', example: '« Die Vorfreude auf die Reise ist riesengroß. »' },
        { term: 'Zuversicht', partOfSpeech: 'noun', phonetic: '/ˈtsuːfɛɐ̯zɪçt/', baseDefinition: 'Firm belief in a positive outcome; confidence.', example: '« Er blickt voller Zuversicht in die Zukunft. »' },
      ],
      ja: [
        { term: '木漏れ日', partOfSpeech: 'noun', phonetic: '/ko.mo.re.bi/', baseDefinition: 'Sunlight filtering through trees and foliage.', example: '« 森の中で綺麗な木漏れ日を見た。 »' },
        { term: '一期一会', partOfSpeech: 'noun', phonetic: '/i.tʃi.ɡo i.tʃi.e/', baseDefinition: 'Treasure every encounter, for it will never recur.', example: '« 人との出会いを一期一会として大切にする。 »' },
        { term: '生き甲斐', partOfSpeech: 'noun', phonetic: '/i.ki.ga.i/', baseDefinition: 'A reason for being; that which gives life purpose and fulfillment.', example: '« 毎日の言語学習が私の生き甲斐です。 »' },
        { term: '侘寂', partOfSpeech: 'noun', phonetic: '/wa.bi sa.bi/', baseDefinition: 'Appreciating beauty that is imperfect, impermanent, and incomplete.', example: '« 日本の伝統美には侘寂の心がある。 »' },
        { term: '森林浴', partOfSpeech: 'noun', phonetic: '/si.n-ri-n-yo-ku/', baseDefinition: 'Forest bathing; taking in the atmosphere of the forest for health.', example: '« 週末に森で森林浴を楽しんだ。 »' },
      ],
      ko: [
        { term: '설레다', partOfSpeech: 'verb', phonetic: '/seol.re.da/', baseDefinition: 'To flutter or feel thrilling excitement in one’s heart.', example: '« 새로운 시작을 앞두고 마음이 설레다. »' },
        { term: '소소하다', partOfSpeech: 'adjective', phonetic: '/so.so.ha.da/', baseDefinition: 'Small, simple, and cozy happiness or detail.', example: '« 소소한 행복을 느끼며 살고 싶다. »' },
        { term: '정', partOfSpeech: 'noun', phonetic: '/jeong/', baseDefinition: 'Warm affection, bonding, and deep human connection.', example: '« 한국 사람들은 정이 많다. »' },
        { term: '눈치', partOfSpeech: 'noun', phonetic: '/nun.chi/', baseDefinition: 'Social tact and quick ability to sense others’ moods and situations.', example: '« 그 사람은 눈치가 빠르다. »' },
        { term: '따뜻하다', partOfSpeech: 'adjective', phonetic: '/tta.ttu.tha.da/', baseDefinition: 'Warm and cozy in heart or temperature.', example: '« 따뜻한 차 한 잔을 마시며 쉰다. »' },
      ],
      zh: [
        { term: '缘分', partOfSpeech: 'noun', phonetic: '/yuán fèn/', baseDefinition: 'Fate or serendipitous connection bringing people together.', example: '« 我们能在这里相遇真是很有缘分。 »' },
        { term: '加油', partOfSpeech: 'verb', phonetic: '/jiā yóu/', baseDefinition: 'To make an extra effort; cheer on!', example: '« 考试加油，你一定可以的！ »' },
        { term: '沉淀', partOfSpeech: 'verb', phonetic: '/chén diàn/', baseDefinition: 'To accumulate and settle knowledge or experience over time.', example: '« 学习需要时间的沉淀。 »' },
        { term: '珍重', partOfSpeech: 'verb', phonetic: '/zhēn zhòng/', baseDefinition: 'To value, treasure, and take good care of oneself.', example: '« 朋友，请多多珍重。 »' },
      ],
      vi: [
        { term: 'thương nhớ', partOfSpeech: 'verb', phonetic: '/tʰɨəŋ ɲə́/', baseDefinition: 'Tình cảm nhớ nhung tha thiết dành cho người thân yêu.', example: '« Anh luôn thương nhớ về quê hương. »' },
        { term: 'an nhiên', partOfSpeech: 'adjective', phonetic: '/aːn ɲiən/', baseDefinition: 'Thái độ sống thong dong, bình yên, không vướng bận ưu phiền.', example: '« Mong bạn luôn an nhiên giữa sóng gió cuộc đời. »' },
        { term: 'hoài niệm', partOfSpeech: 'noun', phonetic: '/hwaːj niəm/', baseDefinition: 'Nhớ lại những kỷ niệm đẹp đẽ đã qua trong quá khứ.', example: '« Bài hát cũ gợi lại bao hoài niệm tuổi học trò. »' },
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
