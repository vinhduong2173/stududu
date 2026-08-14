import * as fs from 'fs';
import * as path from 'path';
import { buildTextPdf } from '../src/modules/question-sets/__fixtures__/document-fixtures';

/**
 * Sinh file PDF & JSON mẫu cho bộ đề:
 *   - Chủ đề: Thời tiết (Weather / てんき)
 *   - Cấp độ: A1 (Sơ cấp / CEFR A1)
 *   - Ngôn ngữ: Tiếng Nhật (Japanese / 日本語)
 *   - Số lượng: 20 câu hỏi (5 Từ vựng, 5 Ngữ pháp, 5 Điền từ, 5 Đọc hiểu)
 *
 * Chạy lệnh:
 *   npx ts-node scripts/generate-sample-pdf.ts
 */

const LINES = [
  'CHU DE: THOI TIET (WEATHER / TENKI) - Trinh do A1 So cap - Tieng Nhat',
  '',
  'TONG QUAN VE THOI TIET TRONG TIENG NHAT (A1)',
  'Trong tieng Nhat, thoi tiet duoc goi la TENKI (Tenki / てんき / 天気).',
  'Khi noi ve thoi tiet, nguoi hoc trinh do A1 can nam duoc cac tu vung',
  'co ban ve cac trang thai thoi tiet va bon mua trong nam.',
  '',
  'TU VUNG CHINH (VOCABULARY)',
  '- てんき (tenki): thoi tiet',
  '- はれ (hare): troi nang, quang dang',
  '- あめ (ame): troi mua',
  '- くもり (kumori): troi nhieu may, u am',
  '- ゆき (yuki): tuyet roi',
  '- かぜ (kaze): gio',
  '- あつい (atsui): nong (thoi tiet)',
  '- さむい (samui): lanh (thoi tiet)',
  '- あたたかい (atatakai): am ap',
  '- すずしい (suzushii): mat me',
  '',
  'MAU CAU NGU PHAP CO BAN (GRAMMAR & SENTENCES)',
  '- Kyou wa ii tenki desu. (Hom nay thoi tiet dep.)',
  '- Kyou wa ame ga futte imasu. (Hom nay troi dang mua.)',
  '- Kinou wa samukatta desu. (Hom qua troi da lanh.)',
  '- Ashita no tenki wa dou desu ka. (Thoi tiet ngay mai the nao?)',
  '- Natsu wa atsui desu. (Mua he thi nong.)',
  '- Fuyu wa samui desu kara, kooto wo kimasu. (Mua dong lanh nen toi mac ao khoac.)',
  '',
  'DOAN VAN DOC HIEU MAU (READING PASSAGE)',
  'Kyou no tenki wa hare desu. Asa kara taiyou ga dete ite, tonikaku atatakai desu.',
  'Demo, gogo kara kaze ga tsuyokunaru deshou. Ashita wa ame ga furu sou desu.',
  'Desu kara, kyou no uchi ni sentaku wo shimasu.',
];

export const SAMPLE_QUESTIONS_A1_JA_WEATHER = [
  // 1. Vocabulary (5 câu từ vựng)
  {
    type: 'vocabulary',
    term: 'てんき (天気)',
    prompt: 'Từ 「てんき (天気)」 trong tiếng Nhật có nghĩa là gì?',
    options: ['Thời tiết', 'Mùa trong năm', 'Bầu trời', 'Nhiệt độ'],
    answerIndex: 0,
    explanation: '「てんき (天気)」 có nghĩa là thời tiết.',
  },
  {
    type: 'vocabulary',
    term: 'あめ (雨)',
    prompt: 'Từ 「あめ (雨)」 chỉ hiện tượng thời tiết nào?',
    options: ['Mưa', 'Nắng', 'Tuyết', 'Sương mù'],
    answerIndex: 0,
    explanation: '「あめ (雨)」 có nghĩa là mưa.',
  },
  {
    type: 'vocabulary',
    term: 'はれ (晴れ)',
    prompt: 'Từ 「はれ (晴れ)」 có nghĩa là gì?',
    options: ['Trời nắng / Nắng đẹp', 'Trời mưa lớn', 'Trời u ám', 'Gió bão'],
    answerIndex: 0,
    explanation: '「はれ (晴れ)」 nghĩa là trời nắng, thời tiết quang đãng.',
  },
  {
    type: 'vocabulary',
    term: 'ゆき (雪)',
    prompt: 'Từ 「ゆき (雪)」 có nghĩa là gì?',
    options: ['Tuyết', 'Mây', 'Mưa rào', 'Cầu vồng'],
    answerIndex: 0,
    explanation: '「ゆき (雪)」 có nghĩa là tuyết.',
  },
  {
    type: 'vocabulary',
    term: 'あつい (暑い)',
    prompt: 'Từ tính từ 「あつい (暑い)」 dùng miêu tả thời tiết như thế nào?',
    options: ['Thời tiết nóng', 'Thời tiết lạnh', 'Thời tiết ấm áp', 'Thời tiết mát mẻ'],
    answerIndex: 0,
    explanation: '「あつい (暑い)」 được dùng để miêu tả thời tiết nóng.',
  },

  // 2. Grammar (5 câu ngữ pháp A1)
  {
    type: 'grammar',
    prompt: 'Chọn trợ từ thích hợp điền vào chỗ trống: 「きょうは あめ ( ) ふっています。」',
    options: ['が', 'を', 'に', 'で'],
    answerIndex: 0,
    explanation: 'Chủ ngữ của hiện tượng tự nhiên (mưa rơi) đi với trợ từ 「が」: あめが ふります.',
  },
  {
    type: 'grammar',
    prompt: 'Chia tính từ 「さむい (寒い)」 ở thì quá khứ khẳng định trong câu: 「きのうは ( ) です。」',
    options: ['さむかった', 'さむでした', 'さむくない', 'さむく'],
    answerIndex: 0,
    explanation: 'Bỏ い thêm かった: さむい -> さむかった.',
  },
  {
    type: 'grammar',
    prompt: 'Chọn mẫu câu đúng để hỏi thời tiết hôm nay thế nào:',
    options: [
      'きょうの てんきは どうですか。',
      'きょうの てんきは なんの ですか。',
      'きょうの てんきは だれですか。',
      'きょうの てんきは どこですか。',
    ],
    answerIndex: 0,
    explanation: 'Mẫu câu hỏi thời tiết/ý kiến: 「〜は どうですか。」',
  },
  {
    type: 'grammar',
    prompt: 'Dạng phủ định hiện tại của tính từ đuôi -i 「あたたかい (暖かい - Ấm áp)」 là gì?',
    options: [
      'あたたかくないです',
      'あたたかいではありません',
      'あたたかいくないです',
      'あたたかくなかったです',
    ],
    answerIndex: 0,
    explanation: 'Tính từ đuôi -i phủ định thì hiện tại đổi い thành くないです.',
  },
  {
    type: 'grammar',
    prompt: 'Chọn câu có nghĩa "Hôm nay trời nhiều mây":',
    options: [
      'きょうは くもりです。',
      'きょうは あめです。',
      'きょうは ゆきです。',
      'きょうは はれです。',
    ],
    answerIndex: 0,
    explanation: '「くもり (曇り)」 là thời tiết nhiều mây, âm u.',
  },

  // 3. Cloze (5 câu điền từ ngữ cảnh)
  {
    type: 'cloze',
    term: 'あつかった',
    prompt: 'Điền từ hợp lý: 「きのうは とても ( ) ですから、うみに いきました。」',
    options: ['あつかった', 'さむかった', 'つめたかった', 'すずしかった'],
    answerIndex: 0,
    explanation: 'Vì trời nóng (あつかった) nên mới đi biển (うみに いきました).',
  },
  {
    type: 'cloze',
    term: 'すずしくて',
    prompt: 'Điền từ thích hợp: 「あきは ( ) て、きもちがいいです。」',
    options: ['すずしく', 'さむく', 'あつく', 'あたたかく'],
    answerIndex: 0,
    explanation: 'Mùa thu (あき) thì mát mẻ (すずしい -> すずしくて), cảm giác dễ chịu.',
  },
  {
    type: 'cloze',
    term: 'あめ',
    prompt: 'Điền từ hợp lý: 「そらが くらいです。( ) が ふるかもしれません。」',
    options: ['あめ', 'はれ', 'たいよう', 'かぜ'],
    answerIndex: 0,
    explanation: 'Bầu trời tối sầm (そらが くらいです), có thể sắp mưa (あめ).',
  },
  {
    type: 'cloze',
    term: 'さむい',
    prompt: 'Điền từ thích hợp: 「ふゆは ( ) から、コートを きましょう。」',
    options: ['さむい', 'あつい', 'あたたかい', 'すずしい'],
    answerIndex: 0,
    explanation: 'Mùa đông (ふゆ) thì lạnh (さむい) nên hãy mặc áo khoác (コート).',
  },
  {
    type: 'cloze',
    term: 'つよく',
    prompt: 'Điền dạng từ thích hợp: 「きょうは かぜが ( ) ふいています。」',
    options: ['つよく', 'たかく', 'おおいく', 'あついく'],
    answerIndex: 0,
    explanation: 'Gió thổi mạnh dùng phó từ つよく (từ tính từ つよい).',
  },

  // 4. Reading (5 câu đọc hiểu)
  {
    type: 'reading',
    passage:
      'きょうの てんきは はれです。あさから たいようが でていて、とても あたたかいです。でも、ごごから かぜが つよくなるでしょう。あしたは あめが ふるそうです。ですから、きょうの うちに せんたくを します。',
    prompt: 'Đoạn văn trên cho biết thời tiết hôm nay (きょう) như thế nào?',
    options: ['はれです (Trời nắng)', 'あめです (Trời mưa)', 'ゆきです (Có tuyết)', 'くもりです (Nhiều mây)'],
    answerIndex: 0,
    explanation: 'Đoạn văn viết: 「きょうの てんきは はれです。」',
  },
  {
    type: 'reading',
    passage:
      'きょうの てんきは はれです。あさから たいようが でていて、とても あたたかいです。でも、ごごから かぜが つよくなるでしょう。あしたは あめが ふるそうです。ですから、きょうの うちに せんたくを します。',
    prompt: 'Nhiệt độ/cảm giác thời tiết hôm nay như thế nào?',
    options: ['とても あたたかい (Rất ấm áp)', 'とても さむい (Rất lạnh)', 'すずしい (Mát mẻ)', 'つめたい (Lạnh giá)'],
    answerIndex: 0,
    explanation: 'Đoạn văn viết: 「とても あたたかいです。」',
  },
  {
    type: 'reading',
    passage:
      'きょうの てんきは はれです。あさから たいようが でていて、とても あたたかいです。でも、ごごから かぜが つよくなるでしょう。あしたは あめが ふるそうです。ですから、きょうの うちに せんたくを します。',
    prompt: 'Điều gì sẽ xảy ra vào buổi chiều (ごごから)?',
    options: ['かぜが つよくなる (Gió mạnh lên)', 'あめが ふりだす (Mưa bắt đầu rơi)', 'ゆきが ふる (Tuyết rơi)', 'さむくなる (Trời trở lạnh)'],
    answerIndex: 0,
    explanation: 'Đoạn văn viết: 「ごごから かぜが つよくなるでしょう。」',
  },
  {
    type: 'reading',
    passage:
      'きょうの てんきは はれです。あさから たいようが でていて、とても あたたかいです。でも、ごごから かぜが つよくなるでしょう。あしたは あめが ふるそうです。ですから、きょうの うちに せんたくを します。',
    prompt: 'Thời tiết ngày mai (あした) được dự báo như thế nào?',
    options: ['あめが ふるそうです (Nghe nói sẽ mưa)', 'はれるそうです (Nghe nói sẽ nắng)', 'ゆきが ふるそうです (Nghe nói sẽ có tuyết)', 'くもるそうです (Nghe nói sẽ u ám)'],
    answerIndex: 0,
    explanation: 'Đoạn văn viết: 「あしたは あめが ふるそうです。」',
  },
  {
    type: 'reading',
    passage:
      'きょうの てんきは はれです。あさから たいようが でていて、とても あたたかいです。でも、ごごから かぜが つよくなるでしょう。あしたは あめが ふるそうです。ですから、きょうの うちに せんたくを します。',
    prompt: 'Tại sao người nói lại giặt quần áo (せんたくを します) trong ngày hôm nay?',
    options: [
      'Vì ngày mai trời nghe nói sẽ mưa (あした あめが ふるからです)',
      'Vì hôm nay trời đang mưa (きょう あめが ふるからです)',
      'Vì ngày mai trời rất nóng (あした あついからです)',
      'Vì hôm nay có tuyết rơi (きょう ゆきが ふるからです)',
    ],
    answerIndex: 0,
    explanation: 'Vì ngày mai dự báo trời mưa nên người nói tranh thủ giặt đồ hôm nay.',
  },
];

async function main() {
  const outputPdfPath = path.join(
    __dirname,
    '..',
    'test',
    'fixtures',
    'sample-thoi-tiet-a1-ja.pdf',
  );
  const outputJsonPath = path.join(
    __dirname,
    '..',
    'test',
    'fixtures',
    'sample-thoi-tiet-a1-ja.json',
  );
  const outputCsvPath = path.join(
    __dirname,
    '..',
    '..',
    'bo_de_thoi_tiet_A1.csv',
  );

  fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });

  // 1. Ghi file PDF tài liệu mẫu
  fs.writeFileSync(outputPdfPath, buildTextPdf(LINES));

  // 2. Ghi file JSON 20 câu hỏi
  fs.writeFileSync(outputJsonPath, JSON.stringify(SAMPLE_QUESTIONS_A1_JA_WEATHER, null, 2), 'utf-8');

  const charCount = LINES.join(' ').replace(/\s+/g, ' ').trim().length;
  console.log(`Da tao PDF mẫu: ${outputPdfPath}`);
  console.log(`Da tao JSON 20 câu hỏi: ${outputJsonPath}`);
  console.log(`Da tao CSV bộ đề: ${outputCsvPath}`);
  console.log(`Kich thuoc PDF: ${(fs.statSync(outputPdfPath).size / 1024).toFixed(1)} KB`);
  console.log(`So ky tu van ban: ~${charCount} (nguong toi thieu 200)`);
  console.log(`So cau hoi da tao: ${SAMPLE_QUESTIONS_A1_JA_WEATHER.length} cau.`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}


