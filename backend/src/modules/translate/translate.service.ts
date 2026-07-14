import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { TranslateDto } from './dto/translate.dto';

// Dịch qua MyMemory (miễn phí, không cần API key) — đủ cho MVP đồ án.
// https://mymemory.translated.net/doc/spec.php
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

interface MyMemoryResponse {
  responseStatus: number;
  responseData?: { translatedText?: string };
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  async translate(dto: TranslateDto) {
    const source = dto.source || 'auto';
    const target = dto.target;

    if (source !== 'auto' && source === target) {
      return { translation: dto.text, source, target };
    }

    // 1. Thử dịch qua Google Translate miễn phí
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(dto.text)}`;
      const res = await fetch(googleUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && data[0]) {
          const translation = data[0].map((item: any) => item[0]).join('');
          const detectedSource = data[2] || source;
          return { translation, source: source === 'auto' ? detectedSource : source, target };
        }
      }
      this.logger.warn(`Google Translate trả về status ${res.status}, chuyển sang MyMemory làm dự phòng`);
    } catch (err) {
      this.logger.warn(`Google Translate lỗi: ${(err as Error).message}, chuyển sang MyMemory làm dự phòng`);
    }

    // 2. Dự phòng (Fallback): Dịch qua MyMemory
    const fallbackSource = source === 'auto' ? this.detectLang(dto.text) : source;
    if (fallbackSource === target) {
      return { translation: dto.text, source: fallbackSource, target };
    }

    try {
      const url = `${MYMEMORY_URL}?q=${encodeURIComponent(dto.text)}&langpair=${fallbackSource}|${target}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as MyMemoryResponse;
      const translation = data.responseData?.translatedText;
      if (data.responseStatus !== 200 || !translation) {
        throw new Error(`MyMemory status ${data.responseStatus}`);
      }
      return { translation, source: fallbackSource, target };
    } catch (err) {
      this.logger.warn(`MyMemory fallback thất bại: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Dịch vụ dịch tạm thời không khả dụng, thử lại sau');
    }
  }

  // Nhận diện thô khi source = auto: dấu tiếng Việt / chữ CJK / mặc định English
  private detectLang(text: string): string {
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) {
      return 'vi';
    }
    if (/[぀-ヿ]/.test(text)) return 'ja';
    if (/[가-힯]/.test(text)) return 'ko';
    if (/[一-鿿]/.test(text)) return 'zh';
    return 'en';
  }
}
