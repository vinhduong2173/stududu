import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { AiQuestionGeneratorService } from '../src/modules/question-sets/ai-question-generator.service';
import { FileExtractorService } from '../src/modules/question-sets/file-extractor.service';
import { QuestionValidatorService } from '../src/modules/question-sets/question-validator.service';

/**
 * Chẩn đoán luồng "sinh câu hỏi từ tài liệu" ngoài giao diện.
 *
 *   npx ts-node scripts/check-ai.ts [duong-dan-file]
 *
 * Chạy đúng ba bước như server: trích xuất file → gọi AI → validate. In ra lỗi
 * THẬT ở bước nào hỏng, thay vì chỉ thấy một thông báo đỏ trên màn hình.
 */

// dotenv đi kèm @nestjs/config — nạp .env giống lúc server chạy
// eslint-disable-next-line @typescript-eslint/no-require-imports
(require('dotenv') as { config: () => void }).config();

const DEFAULT_FILE = path.join(
  __dirname,
  '..',
  'test',
  'fixtures',
  'sample-gia-dinh-b1.pdf',
);

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

async function main() {
  const filePath = process.argv[2] ?? DEFAULT_FILE;
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];

  console.log('=== 0. Cau hinh ===');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(
    `GEMINI_API_KEY : ${apiKey ? `da co (${apiKey.slice(0, 12)}...)` : 'CHUA CO'}`,
  );
  console.log(
    `GEMINI_MODEL   : ${process.env.GEMINI_MODEL ?? '(mac dinh gemini-2.5-flash)'}`,
  );
  if (!apiKey) {
    console.error(
      '\nThieu GEMINI_API_KEY trong backend/.env — day chinh la ly do moi dinh dang deu loi.',
    );
    console.error(
      'Lay khoa mien phi tai https://aistudio.google.com/apikey roi them vao backend/.env:',
    );
    console.error('  GEMINI_API_KEY="AIza..."');
    process.exit(1);
  }

  if (!mimeType) {
    console.error(
      `\nKhong ho tro duoi file "${ext}". Chi nhan .pdf, .docx, .txt`,
    );
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`\nKhong tim thay file: ${filePath}`);
    process.exit(1);
  }

  const config = new ConfigService();

  console.log('\n=== 1. Trich xuat file ===');
  console.log(`File: ${filePath} (${mimeType})`);
  const extractor = new FileExtractorService();
  const extracted = await extractor.extract(
    fs.readFileSync(filePath),
    mimeType,
  );
  console.log(`So ky tu doc duoc: ${extracted.charCount}`);
  console.log(`Bi cat bot       : ${extracted.truncated}`);
  console.log(`Trich 120 ky tu  : ${extracted.text.slice(0, 120)}`);

  console.log('\n=== 2. Goi AI ===');
  const generator = new AiQuestionGeneratorService(config);
  const started = Date.now();
  const result = await generator.generate({
    targetLanguage: 'Tiếng Việt',
    framework: 'CEFR',
    level: 'B1',
    questionCount: 3, // chi 3 cau cho nhanh, du de biet luong co chay khong
    extractedText: extracted.text,
  });
  console.log(
    `AI tra ve ${result.questions.length} cau sau ${Date.now() - started}ms`,
  );
  console.log('sourceMeta:', JSON.stringify(result.sourceMeta));

  console.log('\n=== 3. Validate (dung ham server dung) ===');
  const validator = new QuestionValidatorService();
  const dryRun = validator.dryRun(result.questions);
  console.log(`Hop le: ${dryRun.validCount}/${dryRun.total}`);
  for (const row of dryRun.rows) {
    if (row.valid) {
      console.log(`  [OK ] ${row.question!.prompt.slice(0, 70)}`);
    } else {
      console.log(`  [LOI] ${row.errors.join('; ')}`);
    }
  }

  console.log('\nLuong sinh cau hoi chay duoc binh thuong.');
}

main().catch((err: unknown) => {
  console.error('\n=== THAT BAI ===');
  if (err instanceof Error) {
    console.error(`${err.name}: ${err.message}`);
    if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
  } else {
    console.error(String(err));
  }
  process.exit(1);
});
