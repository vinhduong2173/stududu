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
          this.logger.warn(
            `Dictionary API trả về status ${res.status} cho "${trimmed}" (${lang})`,
          );
        }
        return null;
      }

      const data = (await res.json()) as DictionaryApiEntry[];
      if (!Array.isArray(data) || data.length === 0) return null;

      const entry = data[0];

      // Lấy phonetic — ưu tiên trường `phonetic`, fallback sang phonetics[] ở bất kỳ entry nào trong data
      let phonetic = entry.phonetic || null;
      if (!phonetic) {
        for (const e of data) {
          if (e.phonetic && e.phonetic.trim()) {
            phonetic = e.phonetic.trim();
            break;
          }
          if (e.phonetics && Array.isArray(e.phonetics)) {
            const found = e.phonetics.find((p) => p.text && p.text.trim());
            if (found?.text) {
              phonetic = found.text.trim();
              break;
            }
          }
        }
      }

      // Lấy audioUrl từ phonetics array
      const audioUrl =
        entry.phonetics?.find((p) => p.audio && p.audio.trim() !== '')?.audio ||
        null;

      // Lấy meaning đầu tiên có definition
      const meaning = entry.meanings?.find(
        (m) => m.definitions && m.definitions.length > 0,
      );
      const firstDef = meaning?.definitions?.[0];

      // Lấy example — ưu tiên định nghĩa đầu tiên, nếu không có thì tìm trong toàn bộ meanings/definitions
      let example = firstDef?.example || null;
      if (!example) {
        for (const e of data) {
          if (!e.meanings) continue;
          for (const m of e.meanings) {
            if (!m.definitions) continue;
            const found = m.definitions.find(
              (d) => d.example && d.example.trim(),
            );
            if (found?.example) {
              example = found.example.trim();
              break;
            }
          }
          if (example) break;
        }
      }

      return {
        phonetic,
        partOfSpeech: meaning?.partOfSpeech || null,
        definition: firstDef?.definition || null,
        example: example || firstDef?.example || null,
        audioUrl,
      };
    } catch (err) {
      this.logger.warn(
        `Dictionary API lỗi cho "${trimmed}": ${(err as Error).message}`,
      );
      return null;
    }
  }
}
