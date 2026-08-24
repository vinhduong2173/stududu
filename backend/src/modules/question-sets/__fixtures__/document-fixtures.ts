import JSZip from 'jszip';

/**
 * Sinh file PDF/DOCX thật ngay trong test — không commit file nhị phân vào repo,
 * và luôn dựng lại được khi cần đổi nội dung.
 *
 * (Ngoại lệ: `backend/test/fixtures/sample-gia-dinh-b1.pdf` được sinh sẵn để
 * tải thử qua giao diện Admin — xem `scripts/generate-sample-pdf.ts`.)
 */

interface BuildPdfOptions {
  /** Mỗi phần tử là content stream của một trang (toán tử BT/Tj/ET) */
  pages: string[];
  /** Thêm /Encrypt vào trailer để giả lập PDF đặt mật khẩu */
  encrypted?: boolean;
}

/**
 * Dựng PDF tối thiểu nhưng ĐÚNG CHUẨN: offset trong bảng xref được tính thật,
 * nếu không pdf.js sẽ chạy chế độ phục hồi và test mất ý nghĩa.
 *
 * Bố cục object: 1 = Catalog, 2 = Pages, rồi mỗi trang chiếm 2 object
 * (Page + Contents), cuối cùng là Font.
 */
export function buildPdf({
  pages,
  encrypted = false,
}: BuildPdfOptions): Buffer {
  const pageCount = pages.length;
  const fontId = 3 + pageCount * 2;
  const pageIds = pages.map((_, i) => 3 + i * 2);

  const objects: string[] = [
    '<</Type/Catalog/Pages 2 0 R>>',
    `<</Type/Pages/Kids[${pageIds.map((id) => `${id} 0 R`).join(' ')}]/Count ${pageCount}>>`,
  ];
  pages.forEach((content, i) => {
    objects.push(
      `<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents ${pageIds[i] + 1} 0 R` +
        `/Resources<</Font<</F1 ${fontId} 0 R>>>>>>`,
    );
    objects.push(
      `<</Length ${Buffer.byteLength(content)}>>\nstream\n${content}\nendstream`,
    );
  });
  objects.push('<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>');

  if (encrypted) {
    objects.push(
      `<</Filter/Standard/V 1/R 2/O <${'61'.repeat(32)}>/U <${'62'.repeat(32)}>/P -1>>`,
    );
  }

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, 'latin1');
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  const encryptRef = encrypted
    ? `/Encrypt ${objects.length} 0 R/ID[<${'31'.repeat(16)}><${'31'.repeat(16)}>]`
    : '';
  const trailer =
    `trailer\n<</Size ${objects.length + 1}/Root 1 0 R${encryptRef}>>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, 'latin1');
}

/** Escape ký tự đặc biệt của chuỗi PDF literal */
function pdfEscape(text: string): string {
  return text.replace(/([\\()])/g, '\\$1');
}

/**
 * Hai giới hạn vật lý của trang A4 mà pdf.js áp khi trích xuất: chữ tràn ra
 * ngoài mép phải bị cắt, dòng có toạ độ y âm bị bỏ hẳn. Fixture phải tôn trọng
 * hai giới hạn này, nếu không số ký tự đọc lại được sẽ không khớp đầu vào.
 */
const MAX_CHARS_PER_LINE = 85;
const MAX_LINES_PER_PAGE = 38;

/** Cắt danh sách dòng thành từng trang, tự xuống trang khi hết chỗ */
function paginate(lines: string[]): string[] {
  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += MAX_LINES_PER_PAGE) {
    const chunk = lines.slice(i, i + MAX_LINES_PER_PAGE);
    pages.push(
      chunk
        .map(
          (line, row) =>
            `BT /F1 12 Tf 50 ${740 - row * 18} Td ` +
            `(${pdfEscape(line.slice(0, MAX_CHARS_PER_LINE))}) Tj ET`,
        )
        .join('\n'),
    );
  }
  return pages.length > 0 ? pages : [''];
}

/** PDF nhiều dòng chữ — dùng cho case "đọc được bình thường" */
export function buildTextPdf(lines: string[]): Buffer {
  return buildPdf({ pages: paginate(lines) });
}

/**
 * PDF dài hơn MAX_CHARS (8000) để kiểm tra việc cắt bớt — trải ra nhiều trang
 * vì một trang A4 chỉ chứa được khoảng 3.000 ký tự đọc lại được.
 */
export function buildLongTextPdf(totalChars: number): Buffer {
  const source = LONG_PARAGRAPHS.join(' ');
  const lineCount = Math.ceil(totalChars / MAX_CHARS_PER_LINE);
  const lines = Array.from(
    { length: lineCount },
    (_, i) => source.slice(i % 3, (i % 3) + MAX_CHARS_PER_LINE - 8) + ` [${i}]`,
  );
  return buildTextPdf(lines);
}

/** PDF hợp lệ nhưng chỉ có hình khối, không chữ — giả lập PDF ảnh scan */
export function buildImageOnlyPdf(): Buffer {
  return buildPdf({ pages: ['0 0 0 rg 100 100 400 500 re f'] });
}

/** PDF có /Encrypt — pdf.js sẽ ném PasswordException vì không có mật khẩu */
export function buildEncryptedPdf(): Buffer {
  return buildPdf({
    pages: ['BT /F1 12 Tf 50 700 Td (noi dung bi khoa) Tj ET'],
    encrypted: true,
  });
}

/** Chỉ có header rồi cụt — cấu trúc PDF hỏng */
export function buildTruncatedPdf(): Buffer {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<</Type/Catalog', 'latin1');
}

/** DOCX hợp lệ tối thiểu: [Content_Types].xml + _rels/.rels + word/document.xml */
export async function buildDocx(paragraphs: string[]): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>',
  );
  zip
    .folder('_rels')!
    .file(
      '.rels',
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>',
    );
  const body = paragraphs
    .map((p) => `<w:p><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`)
    .join('');
  zip
    .folder('word')!
    .file(
      'document.xml',
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        `<w:body>${body}</w:body></w:document>`,
    );
  return zip.generateAsync({ type: 'nodebuffer' });
}

/** Zip hợp lệ nhưng thiếu word/document.xml — giả lập .odt hoặc zip đổi đuôi */
export async function buildZipWithoutDocument(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('content.xml', '<office:document/>');
  return zip.generateAsync({ type: 'nodebuffer' });
}

// ===== Vài mẫu byte để giả lập tải nhầm định dạng =====

export const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
export const JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
]);
/** OLE2 — chữ ký của Word 97-2003 (.doc) */
export const LEGACY_DOC_BYTES = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00,
]);

/** Đoạn văn dài đủ vượt ngưỡng MIN_CHARS (200 ký tự) */
export const LONG_PARAGRAPHS = [
  'Gia dinh la don vi co ban cua xa hoi, noi moi nguoi duoc sinh ra va lon len.',
  'Trong tieng Viet, cac tu chi quan he gia dinh rat phong phu va thay doi theo vung mien.',
  'Vi du: bo hoac ba, me hoac ma, anh trai, chi gai, em trai, em gai, ong noi, ba ngoai.',
  'Nguoi hoc can phan biet ro cach xung ho voi tung thanh vien trong gia dinh.',
];
