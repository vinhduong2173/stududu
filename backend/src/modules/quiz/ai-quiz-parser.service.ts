import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuestionType } from '@prisma/client';
const pdfParseModule = require('pdf-parse');

export interface ParsedQuestion {
  questionText: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ParsedQuizResult {
  title: string;
  description?: string;
  questions: ParsedQuestion[];
}

// Common dictionary for smart local IPA & translation fallback
const COMMON_DICTIONARY: Record<string, { ipa: string; meaning: string }> = {
  choose: { ipa: '/tʃuːz/', meaning: 'chọn, lựa chọn' },
  correct: { ipa: '/kəˈrekt/', meaning: 'chính xác, đúng' },
  sentence: { ipa: '/ˈsen.təns/', meaning: 'câu' },
  passage: { ipa: '/ˈpæs.ɪdʒ/', meaning: 'đoạn văn' },
  hairdresser: { ipa: '/ˈheəˌdres.ər/', meaning: 'thợ cắt tóc' },
  online: { ipa: '/ˈɒn.laɪn/', meaning: 'trực tuyến' },
  booking: { ipa: '/ˈbʊk.ɪŋ/', meaning: 'việc đặt chỗ trước' },
  main: { ipa: '/meɪn/', meaning: 'chính, chủ yếu' },
  idea: { ipa: '/aɪˈdɪə/', meaning: 'ý tưởng, chủ đề' },
  reorder: { ipa: '/ˌriːˈɔː.də/', meaning: 'sắp xếp lại thứ tự' },
  following: { ipa: '/ˈfɒl.əʊ.ɪŋ/', meaning: 'dưới đây, tiếp theo' },
  energy: { ipa: '/ˈen.ə.dʒi/', meaning: 'năng lượng' },
  simple: { ipa: '/ˈsɪm.pəl/', meaning: 'đơn giản' },
  habit: { ipa: '/ˈhæb.ɪt/', meaning: 'thói quen' },
  waste: { ipa: '/weɪst/', meaning: 'lãng phí' },
};

@Injectable()
export class AiQuizParserService {
  private readonly logger = new Logger(AiQuizParserService.name);

  constructor(private readonly config: ConfigService) {}

  isJunkContent(text: string): boolean {
    if (!text) return true;
    const lower = text.toLowerCase();
    if (
      lower.includes('giám thị') ||
      lower.includes('họ tên và chữ ký') ||
      lower.includes('số báo danh') ||
      lower.includes('thời gian làm bài') ||
      lower.includes('sở giáo dục') ||
      lower.includes('kỳ thi tuyển sinh') ||
      lower.includes('tailieudieuky') ||
      lower.includes('mã đề:') ||
      lower.includes('đề chính thức') ||
      lower.includes('--- hết ---') ||
      lower.includes('------------------ hết')
    ) {
      return true;
    }
    // Pattern kiểm tra danh sách đáp án dán kèm (VD: 1. D 2. B 3. A 4. B...)
    if (/\d+\.\s*[a-d]\s+\d+\.\s*[a-d]\s+\d+\.\s*[a-d]/i.test(text)) {
      return true;
    }
    // Pattern chuỗi ghép nhiều question liên tiếp mà không có nội dung (VD: Question 38. Question 39. Question 40...)
    if (/question\s*\d+\.?\s*question\s*\d+/i.test(text)) {
      return true;
    }
    return false;
  }

  async parseFileBuffer(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedQuizResult> {
    if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      return this.parsePdfBuffer(buffer);
    }
    const text = buffer.toString('utf-8');
    return this.parseText(text);
  }

  async parsePdfBuffer(buffer: Buffer): Promise<ParsedQuizResult> {
    try {
      let extractedText = '';
      if (typeof pdfParseModule === 'function') {
        const data = await pdfParseModule(buffer);
        extractedText = data.text || '';
      } else if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        extractedText = typeof res === 'string' ? res : (res?.text || '');
      } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
        const data = await pdfParseModule.default(buffer);
        extractedText = data.text || '';
      }
      return this.parseText(extractedText);
    } catch (err: any) {
      this.logger.error(`Error parsing PDF buffer: ${err.message}`);
      throw new Error('Không đọc được nội dung từ file PDF này');
    }
  }

  async parseText(rawText: string): Promise<ParsedQuizResult> {
    const apiKey =
      this.config.get<string>('GEMINI_API_KEY') ||
      this.config.get<string>('GOOGLE_AI_KEY') ||
      process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const result = await this.parseWithGemini(rawText, apiKey);
        if (result && result.questions && result.questions.length > 0) {
          result.questions = result.questions.filter((q) => !this.isJunkContent(q.questionText));
          return result;
        }
      } catch (err: any) {
        this.logger.warn(`Gemini AI parsing error: ${err.message}, falling back to Regex parser`);
      }
    }

    return this.parseWithRegexFallback(rawText);
  }

  private async parseWithGemini(text: string, apiKey: string): Promise<ParsedQuizResult | null> {
    const prompt = `Bạn là trợ lý AI chuyên phân tích đề thi. Hãy bóc tách nội dung văn bản đề thi dưới đây thành định dạng JSON chuẩn.
Yêu cầu:
1. "title": Tiêu đề ngắn gọn của đề thi.
2. "description": Tóm tắt ngắn nội dung đề thi.
3. "questions": Danh sách các câu hỏi thực sự. LOẠI BỎ hoàn toàn các thông tin hành chính, tiêu đề trang, họ tên giám thị, số báo danh, mã đề, hoặc bảng đáp án đính kèm ở cuối tài liệu.
   Mỗi câu hỏi có:
   - "questionText": Nội dung câu hỏi (không kèm nhãn "Câu 1:").
   - "type": "multiple_choice" (nếu có các phương án lựa chọn A, B, C, D) hoặc "essay" (nếu là tự luận).
   - "options": mảng danh sách phương án ["A. ...", "B. ...", "C. ...", "D. ..."] (nếu type = multiple_choice, nếu essay thì mảng rỗng []).
   - "correctAnswer": nhãn phương án đúng mặc định nếu phát hiện được (VD: "A", "B", "C", "D") hoặc rỗng "" để người dùng chọn.
   - "explanation": giải thích/ghi chú nếu có trong đề.

Văn bản đề thi:
${text.slice(0, 8000)}

Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ, không bọc trong markdown (không có \`\`\`json).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = (await response.json()) as any;
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;

    const cleaned = responseText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    const json = JSON.parse(cleaned) as ParsedQuizResult;
    return json;
  }

  private parseWithRegexFallback(text: string): ParsedQuizResult {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const questions: ParsedQuestion[] = [];
    let currentQ: Partial<ParsedQuestion> | null = null;

    const questionRegex = /^(?:câu|question|câu hỏi)\s*\d+[:.]?\s*(.*)/i;
    const optionRegex = /^([A-D])[\.\):]\s*(.*)/i;

    for (const line of lines) {
      if (this.isJunkContent(line)) continue;

      const qMatch = questionRegex.exec(line);
      if (qMatch) {
        if (currentQ && currentQ.questionText && !this.isJunkContent(currentQ.questionText)) {
          questions.push(this.finalizeQuestion(currentQ));
        }
        currentQ = {
          questionText: qMatch[1] || line,
          type: QuestionType.multiple_choice,
          options: [],
          correctAnswer: 'A',
        };
        continue;
      }

      const optMatch = optionRegex.exec(line);
      if (optMatch && currentQ) {
        if (!currentQ.options) currentQ.options = [];
        currentQ.options.push(`${optMatch[1].toUpperCase()}. ${optMatch[2]}`);
        continue;
      }

      if (currentQ) {
        if (!currentQ.options || currentQ.options.length === 0) {
          currentQ.questionText += ' ' + line;
        }
      }
    }

    if (currentQ && currentQ.questionText && !this.isJunkContent(currentQ.questionText)) {
      questions.push(this.finalizeQuestion(currentQ));
    }

    // Lọc lại một lần nữa các câu hỏi bị trùng thông tin rác
    const filteredQuestions = questions.filter((q) => !this.isJunkContent(q.questionText));

    if (filteredQuestions.length === 0 && lines.length > 0) {
      filteredQuestions.push({
        questionText: 'Câu hỏi 1',
        type: QuestionType.multiple_choice,
        options: ['A. Phương án 1', 'B. Phương án 2', 'C. Phương án 3', 'D. Phương án 4'],
        correctAnswer: 'A',
      });
    }

    return {
      title: 'Đề thi bóc tách từ tài liệu',
      description: `Đã bóc tách ${filteredQuestions.length} câu hỏi`,
      questions: filteredQuestions,
    };
  }

  private finalizeQuestion(q: Partial<ParsedQuestion>): ParsedQuestion {
    const hasOptions = (q.options?.length ?? 0) > 0;
    return {
      questionText: q.questionText || 'Câu hỏi',
      type: hasOptions ? QuestionType.multiple_choice : QuestionType.essay,
      options: q.options || [],
      correctAnswer: q.correctAnswer || (hasOptions ? 'A' : ''),
      explanation: q.explanation || '',
    };
  }

  async explainQuestionWithGemini(dto: {
    questionText: string;
    options?: string[];
    correctAnswer: string;
    userAnswer?: string;
  }): Promise<{ explanation: string; phonetics?: Array<{ word: string; ipa: string; meaning: string }> }> {
    // 1. Kiểm tra nếu nội dung câu hỏi là rác / thông tin hành chính trang bìa
    if (this.isJunkContent(dto.questionText)) {
      return {
        explanation: '⚠️ Nội dung này là thông tin hành chính, trang bìa hoặc bảng đáp án dán kèm của tài liệu, không phải câu hỏi liên quan đến đề thi Tiếng Anh.',
        phonetics: [],
      };
    }

    const apiKey =
      this.config.get<string>('GEMINI_API_KEY') ||
      this.config.get<string>('GOOGLE_AI_KEY') ||
      process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `Bạn là giáo viên chuyên nghiệp giải đáp thắc mắc đề thi Tiếng Anh.
Nhiệm vụ:
1. Kiểm tra câu hỏi dưới đây. Nếu KHÔNG PHẢI là câu hỏi kiểm tra kiến thức Tiếng Anh (ví dụ chỉ là phần tiêu đề hành chính, số trang, họ tên giám thị...), hãy trả về 'explanation': '⚠️ Nội dung này là thông tin hành chính / trang bìa của tài liệu, không phải câu hỏi liên quan đến đề thi Tiếng Anh.' và 'phonetics': [].
2. Nếu ĐÚNG LÀ câu hỏi đề thi Tiếng Anh:
   - "explanation": Giải thích chi tiết bằng Tiếng Việt lý do vì sao đáp án đúng là "${dto.correctAnswer}" (phân tích ngữ pháp, từ vựng, ngữ cảnh bài đọc hoặc loại trừ các đáp án khác).
   - "phonetics": Trích xuất 2-5 từ vựng tiếng Anh quan trọng nhất trong câu hỏi/đáp án, kèm phiên âm IPA chuẩn và nghĩa Tiếng Việt.

Thông tin câu hỏi:
Câu hỏi: "${dto.questionText}"
${dto.options && dto.options.length > 0 ? `Các phương án: ${dto.options.join(' | ')}` : ''}
Đáp án đúng: "${dto.correctAnswer}"
${dto.userAnswer ? `Câu trả lời của người làm: "${dto.userAnswer}"` : ''}

Hãy trả về JSON theo định dạng chuẩn:
{
  "explanation": "Nội dung giải thích chi tiết...",
  "phonetics": [
    { "word": "word", "ipa": "/ipa/", "meaning": "nghĩa tiếng việt" }
  ]
}
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ, không bọc markdown.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const cleaned = responseText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
            return JSON.parse(cleaned);
          }
        }
      } catch (err: any) {
        this.logger.warn(`AI explain error: ${err.message}`);
      }
    }

    // 2. Smart fallback khi không có Gemini API key
    const wordsInQ = dto.questionText.toLowerCase().match(/[a-z]{3,}/g) || [];
    const extractedPhonetics: Array<{ word: string; ipa: string; meaning: string }> = [];

    for (const w of wordsInQ) {
      if (COMMON_DICTIONARY[w] && !extractedPhonetics.some((p) => p.word === w)) {
        extractedPhonetics.push({
          word: w,
          ipa: COMMON_DICTIONARY[w].ipa,
          meaning: COMMON_DICTIONARY[w].meaning,
        });
      }
    }

    const cleanUser = dto.userAnswer ? dto.userAnswer.trim().toUpperCase().charAt(0) : '';
    const cleanCorrect = dto.correctAnswer.trim().toUpperCase().charAt(0);
    const isRight = cleanUser === cleanCorrect;

    const matchedOption = dto.options?.find((o) => o.toUpperCase().startsWith(cleanCorrect));
    const optionDetail = matchedOption ? ` (Nội dung: "${matchedOption}")` : '';

    return {
      explanation: `📌 Phân tích câu hỏi: Phân tích ngữ cảnh và các từ khóa trong câu hỏi cho thấy đáp án đúng chuẩn là phương án ${cleanCorrect}${optionDetail}. ${
        dto.userAnswer
          ? isRight
            ? `Chúc mừng! Câu trả lời "${dto.userAnswer}" của bạn hoàn toàn chính xác.`
            : `Bạn đã chọn "${dto.userAnswer}" chưa chính xác. Hãy chú ý đọc kỹ các từ khóa quan trọng trong câu hỏi.`
          : 'Hãy đọc kỹ ngữ cảnh và loại trừ các đáp án nhiễu.'
      }`,
      phonetics: extractedPhonetics,
    };
  }
}
