/**
 * Prompt sinh câu hỏi — question-set-ai-generation-addendum.md mục 2.
 *
 * File này CỐ TÌNH tách khỏi service (addendum mục 6, ưu tiên Cao): sửa prompt là
 * việc của BA/mentor, không nên phải đọc business logic mới chỉnh được một câu chữ.
 * Đổi nội dung prompt thì PHẢI tăng PROMPT_VERSION — `sourceMeta.promptVersion`
 * là thứ duy nhất truy vết được câu hỏi lỗi thuộc phiên bản prompt nào (BR-49).
 */
export const PROMPT_VERSION = 'v2';

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

  return `Bạn là người biên soạn câu hỏi trắc nghiệm tiếng ${targetLanguage} cho người học trình độ ${framework} ${level}.

Từ đoạn văn bản sau, hãy sinh ra ${questionCount} câu hỏi trắc nghiệm (4 đáp án, đúng 1 đáp án đúng).

QUY TẮC BẮT BUỘC:
1. Độ khó phải đúng trình độ ${level} — không dùng từ vựng/ngữ pháp vượt quá cấp độ này.
2. Mỗi câu có đúng 1 đáp án đúng, 3 đáp án nhiễu (distractor).
3. Đáp án nhiễu phải HỢP LÝ — cùng loại từ, cùng độ dài tương đối, không sai ngữ pháp lộ liễu.
   Tránh nhiễu kiểu "rõ ràng sai" (vd: đáp án đúng là danh từ, 3 nhiễu là động từ).
4. Không lặp lại cùng một từ/khái niệm quá 3 câu trong bộ.
5. Ưu tiên loại câu: vocabulary (nghĩa từ trong ngữ cảnh), cloze (điền từ vào chỗ trống), reading (đọc hiểu đoạn ngắn); grammar dùng khi hỏi thuần ngữ pháp.
6. \`options\` phải có ĐÚNG 4 phần tử, không phần tử nào để trống và KHÔNG có hai phần tử trùng nội dung.
   \`answerIndex\` là vị trí của đáp án đúng trong \`options\`, đếm từ 0 (chỉ nhận 0, 1, 2 hoặc 3).
7. Trường bắt buộc theo từng loại câu — thiếu là câu bị loại:
   - \`type\` = "vocabulary" → BẮT BUỘC có \`term\` (từ vựng gốc đang được hỏi).
   - \`type\` = "cloze" hoặc "reading" → BẮT BUỘC có \`passage\` (đoạn văn, tối đa 2000 ký tự).
     Với cloze, \`passage\` chứa chỗ trống dạng "___".
   - \`type\` = "grammar" → \`term\` và \`passage\` để null.
8. Mỗi câu một \`prompt\` khác nhau, tối đa 1000 ký tự — không lặp lại nguyên văn câu đã sinh.
9. Viết \`explanation\` ngắn gọn giải thích vì sao đáp án đúng, bằng tiếng Việt.
10. Nếu đoạn văn bản không đủ nội dung để sinh đủ ${questionCount} câu chất lượng, sinh ít hơn — KHÔNG bịa nội dung ngoài đoạn văn bản.
${note ? `11. Yêu cầu thêm từ người biên soạn: ${note}\n` : ''}
Đoạn văn bản:
"""
${extractedText}
"""

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
