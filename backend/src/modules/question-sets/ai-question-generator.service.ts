import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI, Type } from '@google/genai';
import { buildQuestionPrompt, PROMPT_VERSION } from './question-prompt';

/**
 * Model mặc định — Gemini có gói miễn phí, xem `question-set-ai-generation-addendum.md`
 * mục 2b về lý do đổi khỏi Claude Haiku. Đổi qua biến GEMINI_MODEL trong .env.
 */
const DEFAULT_MODEL = 'gemini-2.0-flash';

/** Một câu hỏi thô AI trả về — CHƯA qua validate (xem question-validator.service.ts) */
export interface RawGeneratedQuestion {
  type: string;
  term: string | null;
  passage: string | null;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GenerateInput {
  targetLanguage: string;
  framework: string;
  level: string;
  questionCount: number;
  extractedText: string;
  note?: string;
}

/** BR-49/BR-57: lưu cùng câu hỏi để truy vết khi phát hiện câu lỗi */
export interface GenerationSourceMeta {
  model: string;
  promptVersion: string;
  extractedCharCount: number;
  generatedAt: string;
  fileName?: string;
  fileType?: string;
}

export interface GenerateResult {
  questions: RawGeneratedQuestion[];
  sourceMeta: GenerationSourceMeta;
}

/**
 * Schema ràng buộc output — chặn JSON sai hình dạng ngay từ đầu thay vì để pipeline
 * validate bắt sau. Gemini dùng tập con của OpenAPI schema: trường cho phép null
 * đánh dấu bằng `nullable: true` (không dùng anyOf như JSON Schema thuần).
 * `propertyOrdering` giữ thứ tự field ổn định giữa các lần gọi.
 */
const QUESTION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['vocabulary', 'grammar', 'cloze', 'reading'],
          },
          term: { type: Type.STRING, nullable: true },
          passage: { type: Type.STRING, nullable: true },
          prompt: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answerIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        },
        propertyOrdering: [
          'type',
          'term',
          'passage',
          'prompt',
          'options',
          'answerIndex',
          'explanation',
        ],
        required: ['type', 'prompt', 'options', 'answerIndex', 'explanation'],
      },
    },
  },
  required: ['questions'],
};

@Injectable()
export class AiQuestionGeneratorService {
  private readonly logger = new Logger(AiQuestionGeneratorService.name);
  private client: GoogleGenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('GEMINI_API_KEY'));
  }

  private getClient(): GoogleGenAI {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      // Không chặn cả tính năng: Admin vẫn thêm câu bằng form nhập tay (BR-56)
      throw new ServiceUnavailableException(
        'Chưa cấu hình GEMINI_API_KEY nên không sinh câu hỏi tự động được. ' +
          'Lấy khoá miễn phí tại https://aistudio.google.com/apikey rồi thêm vào backend/.env, ' +
          'hoặc dùng nút "Thêm câu thủ công".',
      );
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Sinh câu hỏi từ đoạn văn bản đã trích xuất.
   * Retry 1 lần khi AI trả JSON sai schema (addendum mục 3); vẫn lỗi thì ném lỗi
   * rõ ràng để FE hướng Admin sang form nhập tay — không treo màn hình.
   */
  async generate(
    input: GenerateInput,
    fileMeta?: { fileName: string; fileType: string },
  ): Promise<GenerateResult> {
    const client = this.getClient();
    const model = this.config.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;
    const prompt = buildQuestionPrompt(input);

    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: QUESTION_RESPONSE_SCHEMA,
          },
        });

        const text = response.text;
        if (!text) {
          // Thường gặp khi bộ lọc an toàn chặn nội dung, hoặc đứt giữa chừng
          throw new Error(
            `AI không trả về nội dung nào (finishReason: ${
              response.candidates?.[0]?.finishReason ?? 'không rõ'
            }).`,
          );
        }

        const parsed = JSON.parse(text) as {
          questions?: RawGeneratedQuestion[];
        };
        if (!Array.isArray(parsed.questions)) {
          throw new Error('Thiếu mảng "questions" trong JSON trả về.');
        }

        return {
          questions: parsed.questions,
          sourceMeta: {
            model,
            promptVersion: PROMPT_VERSION,
            extractedCharCount: input.extractedText.length,
            generatedAt: new Date().toISOString(),
            ...(fileMeta ?? {}),
          },
        };
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Sinh câu hỏi thất bại (lần ${attempt}/2): ${describeError(err)}`,
        );
        // Lỗi cấu hình/hạn mức thì retry vô nghĩa — dừng ngay để báo đúng nguyên nhân
        if (err instanceof ApiError && !isRetryable(err.status)) break;
      }
    }

    throw new ServiceUnavailableException(explainFailure(lastError));
  }
}

/** 429 = chạm hạn mức, 5xx = lỗi tạm của Google — chỉ hai nhóm này đáng thử lại */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) return `HTTP ${err.status} — ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

/**
 * Đổi lỗi kỹ thuật thành câu Admin hiểu và biết phải làm gì.
 * Gộp hết thành một câu chung sẽ khiến người dùng không biết lỗi do khoá sai,
 * hết hạn mức hay tài liệu có vấn đề — ba tình huống cần ba hành động khác nhau.
 */
function explainFailure(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400 && /API key/i.test(err.message)) {
      return 'Khoá GEMINI_API_KEY không hợp lệ. Kiểm tra lại khoá ở https://aistudio.google.com/apikey.';
    }
    if (err.status === 401 || err.status === 403) {
      return 'Khoá GEMINI_API_KEY bị từ chối (sai khoá hoặc chưa bật quyền cho Gemini API).';
    }
    if (err.status === 429) {
      return 'Đã chạm hạn mức miễn phí của Gemini. Chờ vài phút rồi thử lại, hoặc dùng nút "Thêm câu thủ công".';
    }
    if (err.status === 404) {
      return `Không tìm thấy model đang cấu hình. Kiểm tra biến GEMINI_MODEL trong .env (chi tiết: ${err.message}).`;
    }
    if (err.status >= 500) {
      return 'Dịch vụ Gemini đang lỗi tạm thời. Thử lại sau ít phút.';
    }
    return `Gemini từ chối yêu cầu (HTTP ${err.status}): ${err.message}`;
  }

  return (
    'AI không trả về kết quả hợp lệ sau 2 lần thử. ' +
    'Bạn có thể thử lại với tài liệu khác, hoặc dùng nút "Thêm câu thủ công" để nhập trực tiếp. ' +
    `(Chi tiết: ${describeError(err)})`
  );
}
