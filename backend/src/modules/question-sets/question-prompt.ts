/**
 * Prompt sinh câu hỏi — question-set-ai-generation-addendum.md mục 2.
 *
 * File này CỐ TÌNH tách khỏi service (addendum mục 6, ưu tiên Cao): sửa prompt là
 * việc của BA/mentor, không nên phải đọc business logic mới chỉnh được một câu chữ.
 * Đổi nội dung prompt thì PHẢI tăng PROMPT_VERSION — `sourceMeta.promptVersion`
 * là thứ duy nhất truy vết được câu hỏi lỗi thuộc phiên bản prompt nào (BR-49).
 */
export const PROMPT_VERSION = 'v4';

export interface QuestionPromptVars {
  targetLanguage: string;
  framework: string;
  level: string;
  questionCount: number;
  extractedText: string;
  /** Ghi chú thêm của Admin (tuỳ chọn) — vd "tập trung vào thì quá khứ" */
  note?: string;
}

export function buildQuestionPrompt(vars: QuestionPromptVars): string {
  const {
    targetLanguage,
    framework,
    level,
    questionCount,
    extractedText,
    note,
  } = vars;

  const hasText = Boolean(extractedText && extractedText.trim().length >= 50);
  const countInstruction =
    questionCount > 0
      ? `sinh ra đúng ${questionCount} câu hỏi trắc nghiệm`
      : `TỰ ĐỘNG BÓC TÁCH TOÀN BỘ tất cả các câu hỏi trắc nghiệm có trong tài liệu/đề thi (không giới hạn số câu)`;

  return `Bạn là người biên soạn và bóc tách câu hỏi trắc nghiệm tiếng ${targetLanguage} cho người học trình độ ${framework} ${level}.

Hãy đọc và phân tích toàn bộ nội dung từ ${hasText ? 'đoạn văn bản' : 'tài liệu/hình ảnh đính kèm'} bên dưới, ${countInstruction} (mỗi câu gồm 4 đáp án A, B, C, D và đúng 1 đáp án đúng).

QUY TẮC BÓC TÁCH ĐỀ THI CÓ SẴN (Ví dụ dạng: "Câu 1: Đề bài... Đáp án A... B... C... D..."):
1. Nếu tài liệu đính kèm đã là ĐỀ THI CÓ SẴN:
   - Trích xuất chính xác câu hỏi vào trường \`prompt\`.
   - Trích xuất 4 phương án lựa chọn vào mảng \`options\` [A, B, C, D].
   - Xác định vị trí đáp án đúng trong mảng \`options\` (\`answerIndex\` = 0 cho A, 1 cho B, 2 cho C, 3 cho D). Nếu tài liệu có sẵn đáp án/key, lấy đúng theo key đó.
   - Viết lời giải thích ngắn gọn (\`explanation\`) bằng tiếng Việt.

QUY TẮC BẮT BUỘC CHUNG:
1. Độ khó phải phù hợp trình độ ${level}.
2. Mỗi câu có đúng 1 đáp án đúng, 3 đáp án nhiễu (distractor).
3. \`options\` phải có ĐÚNG 4 phần tử, không phần tử nào để trống và KHÔNG có hai phần tử trùng nội dung.
   \`answerIndex\` là vị trí của đáp án đúng trong \`options\`, đếm từ 0 (chỉ nhận 0, 1, 2 hoặc 3).
4. Trường bắt buộc theo từng loại câu — thiếu là câu bị loại:
   - \`type\` = "vocabulary" → BẮT BUỘC có \`term\` (từ vựng gốc đang được hỏi).
   - \`type\` = "cloze" hoặc "reading" → BẮT BUỘC có \`passage\` (đoạn văn, tối đa 2000 ký tự).
     Với cloze, \`passage\` chứa chỗ trống dạng "___".
   - \`type\` = "grammar" → \`term\` và \`passage\` để null.
5. Mỗi câu một \`prompt\` khác nhau, tối đa 1000 ký tự — không lặp lại nguyên văn câu đã sinh.
6. Viết \`explanation\` ngắn gọn giải thích vì sao đáp án đúng, bằng tiếng Việt.
${note ? `7. Yêu cầu thêm từ người biên soạn: ${note}\n` : ''}
${hasText ? `Nội dung tài liệu:\n"""\n${extractedText}\n"""` : 'Vui lòng nhận diện chữ và phân tích hình ảnh/trang PDF/Word đính kèm để tạo hoặc bóc tách câu hỏi.'}

Trả về JSON đúng schema, KHÔNG kèm lời dẫn hay markdown code fence:
{
  "questions": [
    {
      "type": "vocabulary" | "grammar" | "cloze" | "reading",
      "term": string | null,
      "passage": string | null,
      "prompt": string,
      "options": [string, string, string, string],
      "answerIndex": number,
      "explanation": string
    }
  ]
}`;
}
