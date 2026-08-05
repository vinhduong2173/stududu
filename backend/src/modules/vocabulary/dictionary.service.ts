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
  audioUrl: string | null;
}

interface DictionaryApiMeaning {
  partOfSpeech?: string;
  definitions?: Array<{ definition?: string; example?: string }>;
}

interface DictionaryApiEntry {
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
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

      // Lấy audioUrl từ phonetics array
      let audioUrl =
        entry.phonetics?.find((p) => p.audio && p.audio.trim() !== '')?.audio || null;
      if (audioUrl && audioUrl.startsWith('//')) {
        audioUrl = `https:${audioUrl}`;
      }

      // Lấy definition và example — tìm definition có chứa ví dụ thực tế trong dữ liệu từ điển
      let firstDefinition: string | null = null;
      let firstPartOfSpeech: string | null = null;
      let example: string | null = null;
      let matchedDefinition: string | null = null;

      for (const e of data) {
        if (!e.meanings) continue;
        for (const m of e.meanings) {
          if (!m.definitions) continue;
          for (const d of m.definitions) {
            if (d.definition && !firstDefinition) {
              firstDefinition = d.definition;
              firstPartOfSpeech = m.partOfSpeech || null;
            }
            if (d.example && d.example.trim() !== '') {
              example = d.example.trim();
              matchedDefinition = d.definition || firstDefinition;
              if (!firstPartOfSpeech) firstPartOfSpeech = m.partOfSpeech || null;
              break;
            }
          }
          if (example) break;
        }
        if (example) break;
      }

      const finalDefinition = matchedDefinition || firstDefinition || null;

      return {
        phonetic,
        partOfSpeech: firstPartOfSpeech,
        definition: finalDefinition,
        example,
        audioUrl,
      };
    } catch (err) {
      this.logger.warn(`Dictionary API lỗi cho "${trimmed}": ${(err as Error).message}`);
      return null;
    }
  }
}
