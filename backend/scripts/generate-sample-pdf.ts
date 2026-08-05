import * as fs from 'fs';
import * as path from 'path';
import { buildTextPdf } from '../src/modules/question-sets/__fixtures__/document-fixtures';

/**
 * Sinh file PDF mẫu để tải thử qua giao diện Admin (nút "✨ Sinh từ tài liệu").
 *
 *   npx ts-node scripts/generate-sample-pdf.ts
 *
 * Nội dung cố tình đủ dài (>200 ký tự) và có cấu trúc rõ ràng để AI sinh được
 * câu hỏi từ vựng/điền từ/đọc hiểu — dùng kiểm thử luồng, không phải tài liệu thật.
 *
 * Lưu ý: dùng chữ không dấu vì font Helvetica chuẩn của PDF không có bảng mã
 * tiếng Việt; file này chỉ để kiểm thử luồng, không phải mẫu nội dung cuối cùng.
 */

const LINES = [
  'CHU DE: GIA DINH - Trinh do B1',
  '',
  'Gia dinh la don vi co ban cua xa hoi. Moi gia dinh Viet Nam thuong co',
  'nhieu the he cung chung song duoi mot mai nha, tu ong ba den con chau.',
  '',
  'TU VUNG CHINH',
  '- bo (ba, cha): nguoi dan ong sinh ra minh',
  '- me (ma, u): nguoi phu nu sinh ra minh',
  '- anh trai: nguoi con trai lon tuoi hon trong cung gia dinh',
  '- chi gai: nguoi con gai lon tuoi hon trong cung gia dinh',
  '- em trai, em gai: nguoi it tuoi hon trong cung gia dinh',
  '- ong noi, ba noi: bo me cua bo',
  '- ong ngoai, ba ngoai: bo me cua me',
  '- co, di, chu, bac, cau, mo: anh chi em cua bo hoac me',
  '',
  'CACH XUNG HO',
  'Trong tieng Viet, cach xung ho thay doi theo tuoi tac va vai ve chu khong',
  'dung chung mot dai tu nhu nhieu ngon ngu khac. Nguoi it tuoi hon goi nguoi',
  'lon tuoi hon bang tu chi vai ve, va tu xung bang tu chi vai ve cua minh.',
  'Vi du: em chao anh; con moi bo an com; chau cam on ba a.',
  '',
  'MAU CAU THUONG DUNG',
  '- Gia dinh ban co may nguoi?',
  '- Gia dinh toi co bon nguoi: bo, me, em gai va toi.',
  '- Ban co anh chi em khong?',
  '- Toi la con ca trong nha. / Toi la con ut trong nha.',
  '- Cuoi tuan gia dinh toi thuong an com chung voi ong ba.',
  '',
  'GHI CHU VE VAN HOA',
  'Nguoi mien Bac thuong goi cha me la bo me, nguoi mien Nam goi la ba ma.',
  'Ngay Tet, con chau ve tham ong ba va chuc tho, day la net dep truyen thong',
  'duoc giu gin qua nhieu the he trong gia dinh Viet Nam.',
];

const outputPath = path.join(
  __dirname,
  '..',
  'test',
  'fixtures',
  'sample-gia-dinh-b1.pdf',
);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buildTextPdf(LINES));

const charCount = LINES.join(' ').replace(/\s+/g, ' ').trim().length;
console.log(`Da tao: ${outputPath}`);
console.log(
  `Kich thuoc: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`,
);
console.log(`So ky tu van ban: ~${charCount} (nguong toi thieu la 200)`);
