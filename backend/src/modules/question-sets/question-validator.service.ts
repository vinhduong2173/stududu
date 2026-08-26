import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';

/**
 * Pipeline kiểm tra DÙNG CHUNG cho mọi nguồn câu hỏi — BR-55: câu do AI sinh và câu
 * Admin nhập tay đi qua đúng hàm này, không có đường tắt theo nguồn.
 */

export interface CandidateQuestion {
  type?: string | null;
  term?: string | null;
  passage?: string | null;
  prompt?: string | null;
  options?: unknown;
  answerIndex?: unknown;
  explanation?: string | null;
}

/** Câu đã chuẩn hoá — sẵn sàng ghi DB */
export interface NormalizedQuestion {
  type: QuestionType;
  term: string | null;
  passage: string | null;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string | null;
}

export interface DryRunRow {
  index: number;
  valid: boolean;
  errors: string[];
  question: NormalizedQuestion | null;
  /** Giữ lại bản thô để FE hiển thị đúng cái AI trả về khi dòng bị lỗi */
  raw: CandidateQuestion;
}

export interface DryRunResult {
  total: number;
  validCount: number;
  errorCount: number;
  rows: DryRunRow[];
}

const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 4;
const MAX_PROMPT_LEN = 1000;
const MAX_OPTION_LEN = 300;
const MAX_PASSAGE_LEN = 2000;

/** So khớp câu trùng: bỏ dấu câu/khoảng trắng thừa để bắt được trùng "gần đúng" */
export function normalizePromptKey(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[.,!?;:'"“”‘’()[\]{}\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class QuestionValidatorService {
  /**
   * @param existingPrompts prompt của các câu đã có trong bộ (để bắt trùng)
   */
  dryRun(
    candidates: CandidateQuestion[],
    existingPrompts: string[] = [],
  ): DryRunResult {
    const seen = new Set(existingPrompts.map(normalizePromptKey));
    const rows: DryRunRow[] = candidates.map((raw, index) => {
      const errors: string[] = [];
      const question = this.normalize(raw, errors);

      if (question) {
        const key = normalizePromptKey(question.prompt);
        if (seen.has(key)) {
          errors.push('Câu hỏi trùng với một câu đã có trong bộ đề');
        } else {
          seen.add(key);
        }
      }

      return {
        index,
        valid: errors.length === 0 && question !== null,
        errors,
        question: errors.length === 0 ? question : null,
        raw,
      };
    });

    const validCount = rows.filter((r) => r.valid).length;
    return {
      total: rows.length,
      validCount,
      errorCount: rows.length - validCount,
      rows,
    };
  }

  /** Validate một câu lẻ (form nhập tay) — trả về câu đã chuẩn hoá hoặc danh sách lỗi */
  validateOne(
    raw: CandidateQuestion,
    existingPrompts: string[] = [],
  ): { question: NormalizedQuestion | null; errors: string[] } {
    const result = this.dryRun([raw], existingPrompts);
    const row = result.rows[0];
    return { question: row.question, errors: row.errors };
  }

  private normalize(
    raw: CandidateQuestion,
    errors: string[],
  ): NormalizedQuestion | null {
    const type = this.parseType(raw.type, errors);
    const prompt = (raw.prompt ?? '').trim();
    if (!prompt) {
      errors.push('Thiếu nội dung câu hỏi');
    } else if (prompt.length > MAX_PROMPT_LEN) {
      errors.push(`Câu hỏi quá dài (tối đa ${MAX_PROMPT_LEN} ký tự)`);
    }

    const options = this.parseOptions(raw.options, errors);
    const answerIndex = this.parseAnswerIndex(raw.answerIndex, options, errors);

    const term = (raw.term ?? '').trim() || null;
    const passage = (raw.passage ?? '').trim() || null;

    if (type === QuestionType.vocabulary && !term) {
      errors.push('Câu loại "vocabulary" phải có từ vựng gốc (term)');
    }
    if (
      (type === QuestionType.cloze || type === QuestionType.reading) &&
      !passage
    ) {
      errors.push(`Câu loại "${type}" phải có đoạn văn (passage)`);
    }
    if (passage && passage.length > MAX_PASSAGE_LEN) {
      errors.push(`Đoạn văn quá dài (tối đa ${MAX_PASSAGE_LEN} ký tự)`);
    }

    if (errors.length > 0 || !type || !options || answerIndex === null) {
      return null;
    }

    return {
      type,
      term,
      passage,
      prompt,
      options,
      answerIndex,
      explanation: (raw.explanation ?? '').trim() || null,
    };
  }

  private parseType(value: unknown, errors: string[]): QuestionType | null {
    if (typeof value === 'string' && value in QuestionType) {
      return value as QuestionType;
    }
    errors.push(
      `Loại câu hỏi không hợp lệ (chỉ nhận: ${Object.keys(QuestionType).join(', ')})`,
    );
    return null;
  }

  private parseOptions(value: unknown, errors: string[]): string[] | null {
    if (!Array.isArray(value)) {
      errors.push('Thiếu danh sách đáp án');
      return null;
    }
    const options = value.map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (options.length < MIN_OPTION_COUNT || options.length > MAX_OPTION_COUNT) {
      errors.push(
        `Phải có từ ${MIN_OPTION_COUNT} đến ${MAX_OPTION_COUNT} đáp án (đang có ${options.length})`,
      );
      return null;
    }
    if (options.some((o) => !o)) {
      errors.push('Có đáp án để trống');
      return null;
    }
    if (options.some((o) => o.length > MAX_OPTION_LEN)) {
      errors.push(`Đáp án quá dài (tối đa ${MAX_OPTION_LEN} ký tự)`);
      return null;
    }
    const unique = new Set(options.map((o) => o.toLowerCase()));
    if (unique.size !== options.length) {
      errors.push('Có hai đáp án trùng nội dung');
      return null;
    }
    return options;
  }

  private parseAnswerIndex(
    value: unknown,
    options: string[] | null,
    errors: string[],
  ): number | null {
    const index = typeof value === 'number' ? value : Number(value);
    const maxIdx = options ? options.length - 1 : MAX_OPTION_COUNT - 1;
    if (!Number.isInteger(index) || index < 0 || index > maxIdx) {
      errors.push(`Vị trí đáp án đúng phải là số từ 0 đến ${maxIdx}`);
      return null;
    }
    if (options && !options[index]) {
      errors.push('Đáp án đúng trỏ tới ô trống');
      return null;
    }
    return index;
  }
}
