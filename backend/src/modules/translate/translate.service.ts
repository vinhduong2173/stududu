import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslateDto } from './dto/translate.dto';

// Dịch qua MyMemory (miễn phí, không cần API key) — dự phòng
// https://mymemory.translated.net/doc/spec.php
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

interface MyMemoryResponse {
  responseStatus: number;
  responseData?: { translatedText?: string };
}

interface CacheEntry {
  result: string;
  ts: number;
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly config: ConfigService) {}

  async translate(dto: TranslateDto) {
    const source = dto.source || 'auto';
    const target = dto.target;

    if (source !== 'auto' && source === target) {
      return { translation: dto.text, source, target };
    }

    // Cache lookup
    const truncatedText = dto.text.slice(0, 200);
    const cacheKey = `${source}|${target}|${truncatedText}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      if (Date.now() - cached.ts < this.CACHE_TTL) {
        // Cache hit: Move to end (LRU behavior)
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, cached);
        return { translation: cached.result, source, target };
      } else {
        // Expired
        this.cache.delete(cacheKey);
      }
    }

    let translation: string | undefined;
    let detectedSource = source;

    const apiKey = this.config.get<string>('GOOGLE_TRANSLATE_API_KEY');
    if (apiKey) {
      try {
        // Use official Google Translate API v2
        const url = new URL(
          'https://translation.googleapis.com/language/translate/v2',
        );
        url.searchParams.append('key', apiKey);
        url.searchParams.append('q', dto.text);
        url.searchParams.append('target', target);
        if (source !== 'auto') {
          url.searchParams.append('source', source);
        }

        const res = await fetch(url.toString(), {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          const translations = data?.data?.translations;
          if (translations && translations[0]) {
            translation = translations[0].translatedText;
            detectedSource = translations[0].detectedSourceLanguage || source;
          }
        } else {
          this.logger.warn(
            `Google Translate API error: status ${res.status}, falling back to MyMemory`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Google Translate API error: ${(err as Error).message}, falling back to MyMemory`,
        );
      }
    }

    // Fallback 1: Google Translate GTX (miễn phí, chất lượng cao)
    if (!translation) {
      try {
        const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(dto.text)}`;
        const res = await fetch(gtxUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const translatedText = data?.[0]?.map((x: any) => x[0]).join('');
          if (translatedText) {
            translation = translatedText;
            detectedSource =
              data?.[2] ||
              (source === 'auto' ? this.detectLang(dto.text) : source);
          }
        }
      } catch (err) {
        this.logger.warn(
          `Google GTX translate error: ${(err as Error).message}`,
        );
      }
    }

    // Fallback 2: MyMemory
    if (!translation) {
      const fallbackSource =
        source === 'auto' ? this.detectLang(dto.text) : source;
      if (fallbackSource === target) {
        return { translation: dto.text, source: fallbackSource, target };
      }

      try {
        const url = `${MYMEMORY_URL}?q=${encodeURIComponent(dto.text)}&langpair=${fallbackSource}|${target}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = (await res.json()) as MyMemoryResponse;
        const fallbackTranslation = data.responseData?.translatedText;
        if (data.responseStatus !== 200 || !fallbackTranslation) {
          throw new Error(`MyMemory status ${data.responseStatus}`);
        }
        translation = fallbackTranslation;
        detectedSource = fallbackSource;
      } catch (err) {
        this.logger.warn(`MyMemory fallback failed: ${(err as Error).message}`);
        throw new ServiceUnavailableException(
          'Dịch vụ dịch tạm thời không khả dụng, thử lại sau',
        );
      }
    }

    // Store in cache
    if (translation) {
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }
      this.cache.set(cacheKey, { result: translation, ts: Date.now() });
    }

    return {
      translation,
      source: source === 'auto' ? detectedSource : source,
      target,
    };
  }

  // Nhận diện thô ngôn ngữ: CJK / Tiếng Việt / Tiếng Pháp / Tây Ban Nha / Đức / mặc định English
  detectLang(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return 'en';

    // 1. Japanese (Hiragana / Katakana)
    if (/[぀-ヿ]/.test(trimmed)) return 'ja';
    // 2. Korean (Hangul)
    if (/[가-힯]/.test(trimmed)) return 'ko';
    // 3. Chinese (CJK Unified Ideographs)
    if (/[一-鿿]/.test(trimmed)) return 'zh';

    // 4. Vietnamese specific characters (đ, ư, ơ, ă, â or Vietnamese tone marks: ả, ã, ạ, ẳ, ẵ, ặ, ẩ, ẫ, ậ, ẻ, ẽ, ẹ, ể, ễ, ệ, ỉ, ĩ, ị, ỏ, õ, ọ, ổ, ỗ, ộ, ở, ỡ, ợ, ủ, ũ, ụ, ử, ữ, ự, ỳ, ỷ, ỹ, ỵ)
    if (/[đươăâĐƯƠĂÂ]/i.test(trimmed) || /[ảãạẳẵặẩẫậẻẽẹểễệỉĩịỏõọổỗộởỡợủũụửữựỳỷỹỵ]/i.test(trimmed)) {
      return 'vi';
    }

    // 5. French specific accented letters (é, è, à, ù, ç, œ, æ, ê, ë, î, ï, ô, û, ü, ÿ)
    if (/[éèàùçœæêëîïôûüÿ]/i.test(trimmed)) {
      return 'fr';
    }

    // 6. Spanish (ñ, ¿, ¡)
    if (/[ñ¿¡]/i.test(trimmed)) return 'es';

    // 7. German (ä, ö, ü, ß)
    if (/[äöüß]/i.test(trimmed)) return 'de';

    return 'en';
  }
}
