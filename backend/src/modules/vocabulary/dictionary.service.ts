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
        if (lang === 'ja') {
          const jishoRes = await this.lookupJisho(trimmed);
          if (jishoRes) return jishoRes;
        }
        const wikResult = await this.lookupWiktionary(trimmed, lang);
        if (wikResult) return wikResult;

        if (res.status !== 404) {
          this.logger.warn(
            `Dictionary API trả về status ${res.status} cho "${trimmed}" (${lang})`,
          );
        }
        return null;
      }

      const data = (await res.json()) as DictionaryApiEntry[];
      if (!Array.isArray(data) || data.length === 0) {
        if (lang === 'ja') {
          const jishoRes = await this.lookupJisho(trimmed);
          if (jishoRes) return jishoRes;
        }
        return await this.lookupWiktionary(trimmed, lang);
      }

      const entry = data[0];

      // Lấy phonetic — ưu tiên trường `phonetic`, fallback sang phonetics[]
      const phonetic =
        entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || null;

      // Lấy audioUrl từ phonetics array
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
      if (lang === 'ja') {
        const jishoRes = await this.lookupJisho(trimmed);
        if (jishoRes) return jishoRes;
      }
      const wikResult = await this.lookupWiktionary(trimmed, lang);
      if (wikResult) return wikResult;

      this.logger.warn(`Dictionary API lỗi cho "${trimmed}": ${(err as Error).message}`);
      return null;
    }
  }

  private async lookupJisho(word: string): Promise<DictionaryResult | null> {
    try {
      const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.data || !Array.isArray(json.data) || json.data.length === 0) return null;

      const item = json.data[0];
      const japaneseObj = item.japanese?.[0] || {};
      const reading = japaneseObj.reading || null;
      const phonetic = reading ? `/${reading}/` : null;

      const sense = item.senses?.[0] || {};
      const partOfSpeech = sense.parts_of_speech?.[0] || 'noun';
      const definitions = sense.english_definitions || [];
      const definition = definitions.length > 0 ? definitions.join('; ') : null;

      return {
        phonetic,
        partOfSpeech,
        definition,
        example: null,
        audioUrl: null,
      };
    } catch (err) {
      this.logger.warn(`Jisho API lookup error for "${word}": ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Lấy danh sách từ vựng ngẫu nhiên từ API 3rd-party (Datamuse API / Random Word API)
   */
  async fetchRandomWords(lang = 'en', count = 5): Promise<string[]> {
    if (lang.toLowerCase() !== 'en') return [];
    try {
      const url = `https://api.datamuse.com/words?topics=life,learning,nature,mind,emotion,culture,growth,science&max=100`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{ word: string }>;
      if (!Array.isArray(data) || data.length === 0) return [];

      const filtered = data
        .map((item) => item.word.toLowerCase().trim())
        .filter((w) => w.length >= 4 && w.length <= 15 && /^[a-z]+$/.test(w));

      const shuffled = filtered.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (err) {
      this.logger.warn(`Fetch random words error for ${lang}: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Tra cứu Wiktionary API (Open API miễn phí của Wikimedia) cho tất cả các ngôn ngữ (fr, es, de, ko, zh, vi, ja...)
   */
  private async lookupWiktionary(word: string, lang: string): Promise<DictionaryResult | null> {
    try {
      const cleanLang = lang.toLowerCase().trim();
      const url = `https://${encodeURIComponent(cleanLang)}.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(word)}&format=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      const pages = json?.query?.pages;
      if (!pages) return null;

      const pageId = Object.keys(pages)[0];
      if (!pageId || pageId === '-1') return null;

      const extract: string = pages[pageId].extract || '';
      if (!extract.trim()) return null;

      // Tìm phiên âm IPA dạng /.../ hoặc [...] trong văn bản giải nghĩa Wiktionary
      const ipaMatch = extract.match(/\/[^\/\n]{2,30}\/|\[[^\]\n]{2,30}\]/);
      const phonetic = ipaMatch ? ipaMatch[0] : null;

      // Lấy dòng định nghĩa đầu tiên có nghĩa
      const lines = extract.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      let definition: string | null = null;
      for (const line of lines) {
        if (!line.startsWith('=') && !line.startsWith('IPA') && line.length > 5 && !line.includes('===')) {
          definition = line;
          break;
        }
      }

      if (!definition && !phonetic) return null;

      return {
        phonetic,
        partOfSpeech: null,
        definition: definition ? definition.slice(0, 180) : word,
        example: null,
        audioUrl: null,
      };
    } catch (err) {
      this.logger.warn(`Wiktionary API lookup error for "${word}" (${lang}): ${(err as Error).message}`);
      return null;
    }
  }
}
