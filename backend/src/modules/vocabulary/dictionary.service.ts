import { Injectable, Logger } from '@nestjs/common';

/**
 * Tra từ điển qua Free Dictionary API (miễn phí, không cần key).
 * https://dictionaryapi.dev/
 *
 * Hỗ trợ tốt nhất cho tiếng Anh; một số ngôn ngữ khác (es, fr, de, it, pt, ja...)
 * cũng có dữ liệu nhưng không đầy đủ.
 */
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries';

export interface DictionaryResult {
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string | null;
  example: string | null;
}

interface DictionaryApiMeaning {
  partOfSpeech?: string;
  definitions?: Array<{ definition?: string; example?: string }>;
}

interface DictionaryApiEntry {
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: DictionaryApiMeaning[];
}

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  /**
   * Tra từ điển — trả kết quả đầu tiên tìm được.
   * Trả `null` nếu từ không tồn tại, API lỗi, hoặc ngôn ngữ không hỗ trợ.
   */
  async lookup(word: string, lang = 'en'): Promise<DictionaryResult | null> {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return null;

    try {
      const url = `${DICTIONARY_API}/${encodeURIComponent(lang)}/${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!res.ok) {
        // 404 = từ không tồn tại trong từ điển — bình thường, không log warning
        if (res.status !== 404) {
          this.logger.warn(`Dictionary API trả về status ${res.status} cho "${trimmed}" (${lang})`);
        }
        return null;
      }

      const data = (await res.json()) as DictionaryApiEntry[];
      if (!Array.isArray(data) || data.length === 0) return null;

      const entry = data[0];

      // Lấy phonetic — ưu tiên trường `phonetic`, fallback sang phonetics[]
      const phonetic =
        entry.phonetic ||
        entry.phonetics?.find((p) => p.text)?.text ||
        null;

      // Lấy meaning đầu tiên có definition
      const meaning = entry.meanings?.find(
        (m) => m.definitions && m.definitions.length > 0,
      );
      const firstDef = meaning?.definitions?.[0];

      return {
        phonetic,
        partOfSpeech: meaning?.partOfSpeech || null,
        definition: firstDef?.definition || null,
        example: firstDef?.example || null,
      };
    } catch (err) {
      this.logger.warn(`Dictionary API lỗi cho "${trimmed}": ${(err as Error).message}`);
      return null;
    }
  }
}
