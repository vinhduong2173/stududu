import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { InvalidPDFException, PasswordException, PDFParse } from 'pdf-parse';

export type SupportedFileType = 'pdf' | 'docx' | 'txt';

export interface ExtractResult {
  text: string;
  charCount: number;
  truncated: boolean;
}

/** Giới hạn an toàn trước khi đưa vào prompt AI (question-set-ai-only-flow.md mục 3.2) */
const MAX_CHARS = 8000;

/** Dưới ngưỡng này coi như không đủ nội dung để sinh câu hỏi có chất lượng */
const MIN_CHARS = 200;

/** BR-54 — chốt giới hạn kích thước file (mục 11 câu hỏi 1) */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Tỉ lệ ký tự hỏng tối đa chấp nhận được khi decode TXT.
 * Vài byte lạ trong file dài là chuyện thường (copy từ nguồn khác encoding);
 * quá ngưỡng này thì gần như chắc chắn là file nhị phân đổi đuôi.
 */
const MAX_REPLACEMENT_RATIO = 0.05;

/** Ký tự NUL — dựng bằng fromCharCode, để nguyên byte 0 trong source là lỗi lint */
const NUL = String.fromCharCode(0);

/** Mã điểm BOM của UTF-8 */
const UTF8_BOM = 0xfeff;

/** Nhận dạng file THẬT theo magic byte — để báo đúng thứ Admin đang tải nhầm */
const MAGIC_SIGNATURES: { label: string; bytes: number[] }[] = [
  { label: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  {
    label: 'ZIP hoặc file Office (DOCX/XLSX/PPTX)',
    bytes: [0x50, 0x4b, 0x03, 0x04],
  },
  { label: 'PNG', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { label: 'JPEG', bytes: [0xff, 0xd8, 0xff] },
  { label: 'GIF', bytes: [0x47, 0x49, 0x46, 0x38] },
  { label: 'RTF', bytes: [0x7b, 0x5c, 0x72, 0x74, 0x66] }, // {\rtf
  { label: 'Word bản cũ (.doc)', bytes: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2
  { label: 'RAR', bytes: [0x52, 0x61, 0x72, 0x21] },
  { label: '7-Zip', bytes: [0x37, 0x7a, 0xbc, 0xaf] },
];

/** Mô tả file thật dựa trên vài byte đầu; null nếu không nhận ra */
function sniffActualFormat(buffer: Buffer): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (
      buffer.length >= sig.bytes.length &&
      sig.bytes.every((b, i) => buffer[i] === b)
    ) {
      return sig.label;
    }
  }
  return null;
}

/** Câu bổ sung "file này thật ra là X" khi Admin tải nhầm định dạng */
function mismatchHint(buffer: Buffer, expected: string): string {
  const actual = sniffActualFormat(buffer);
  if (!actual || actual === expected) return '';
  return ` File bạn tải lên thật ra là ${actual} — có thể bạn vừa đổi đuôi tên file.`;
}

/**
 * Trích xuất text từ PDF/DOCX/TXT — dùng chung cho mọi nguồn tài liệu Admin tải lên.
 * BR-54: chỉ file có văn bản trích xuất được, KHÔNG OCR ảnh scan.
 *
 * Nguyên tắc thông báo lỗi: mỗi nguyên nhân một câu riêng, nói rõ Admin phải làm gì
 * tiếp theo. "File không hợp lệ" chung chung khiến người dùng không biết sửa gì
 * (question-set-ai-only-flow.md mục 3.2).
 */
@Injectable()
export class FileExtractorService {
  private readonly logger = new Logger(FileExtractorService.name);

  async extract(file: Buffer, mimeType: string): Promise<ExtractResult> {
    if (file.byteLength === 0) {
      throw new BadRequestException('File rỗng (0 byte) — hãy chọn lại file.');
    }
    if (file.byteLength > MAX_FILE_BYTES) {
      throw new BadRequestException(
        `File quá lớn (${(file.byteLength / 1024 / 1024).toFixed(1)}MB). Giới hạn ${
          MAX_FILE_BYTES / 1024 / 1024
        }MB.`,
      );
    }

    const type = this.detectType(mimeType);
    const raw = await this.readByType(file, type);
    const cleaned = raw.replace(/\s+/g, ' ').trim();

    if (cleaned.length === 0) {
      throw new BadRequestException(this.noTextMessage(type));
    }
    if (cleaned.length < MIN_CHARS) {
      throw new BadRequestException(
        `Nội dung đọc được quá ngắn (${cleaned.length} ký tự), cần tối thiểu ${MIN_CHARS} ký tự ` +
          'để sinh được câu hỏi có chất lượng. Hãy dùng tài liệu dài hơn.',
      );
    }

    return {
      text: cleaned.slice(0, MAX_CHARS),
      charCount: cleaned.length,
      truncated: cleaned.length > MAX_CHARS,
    };
  }

  private readByType(file: Buffer, type: SupportedFileType): Promise<string> {
    switch (type) {
      case 'pdf':
        return this.readPdf(file);
      case 'docx':
        return this.readDocx(file);
      case 'txt':
        return Promise.resolve(this.readTxt(file));
    }
  }

  // ===== PDF =====

  private async readPdf(file: Buffer): Promise<string> {
    // pageJoiner: '' — tắt chuỗi "-- 1 of 3 --" mà pdf-parse chèn cuối mỗi trang,
    // nếu không nó lọt thẳng vào prompt AI như thể là nội dung tài liệu.
    const parser = new PDFParse({ data: file });
    try {
      const result = await parser.getText({ pageJoiner: '' });
      return result.text;
    } catch (err) {
      throw this.translatePdfError(err, file);
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  private translatePdfError(err: unknown, file: Buffer): BadRequestException {
    // PDF có mật khẩu — pdf.js ném PasswordException cả khi thiếu mật khẩu
    // lẫn khi mật khẩu sai; với luồng này cả hai đều là "không mở được".
    if (err instanceof PasswordException) {
      return new BadRequestException(
        'PDF này đang được đặt mật khẩu nên không đọc được nội dung. ' +
          'Hãy gỡ mật khẩu (Save As / Print to PDF) rồi tải lại.',
      );
    }

    if (err instanceof InvalidPDFException) {
      const message = String(err.message);
      // pdf.js phân biệt "file rỗng" với "cấu trúc hỏng" — giữ nguyên phân biệt đó
      if (message.includes('empty')) {
        return new BadRequestException(
          'File PDF rỗng (không có dữ liệu) — hãy chọn lại file.',
        );
      }
      return new BadRequestException(
        `File PDF hỏng hoặc không đúng định dạng PDF.${mismatchHint(file, 'PDF')} ` +
          'Thử mở lại bằng trình đọc PDF rồi "Save As" một bản mới.',
      );
    }

    // Lỗi ngoài dự kiến: giữ nguyên stack ở log server, không đổ chi tiết kỹ thuật
    // ra cho Admin vì họ không làm gì được với nó.
    this.logger.error(
      `Lỗi không lường trước khi đọc PDF: ${err instanceof Error ? err.stack : String(err)}`,
    );
    return new BadRequestException(
      'Không đọc được file PDF này vì một lỗi không lường trước. ' +
        'Hãy thử tài liệu khác, hoặc dùng nút "Thêm câu thủ công".',
    );
  }

  // ===== DOCX =====

  private async readDocx(file: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: file });
      return result.value;
    } catch (err) {
      throw this.translateDocxError(err, file);
    }
  }

  /**
   * mammoth/jszip chỉ ném `Error` thường, phân biệt duy nhất qua message —
   * nên phải khớp theo chuỗi. Nếu nâng cấp mammoth thì kiểm tra lại các mốc này.
   */
  private translateDocxError(err: unknown, file: Buffer): BadRequestException {
    const message = err instanceof Error ? err.message : String(err);

    // Là zip hợp lệ nhưng thiếu word/document.xml → .odt, .pages, hoặc zip đổi đuôi
    if (message.includes('Could not find main document part')) {
      return new BadRequestException(
        'File này là một file nén hợp lệ nhưng không phải tài liệu Word. ' +
          'Nếu là .odt hoặc .doc bản cũ, hãy mở bằng Word rồi "Save As" sang .docx.',
      );
    }

    // Không phải zip → .doc cũ (OLE2), PDF/ảnh đổi đuôi, hoặc file hỏng
    if (
      message.includes('end of central directory') ||
      message.includes('Corrupted zip') ||
      message.includes('End of data reached')
    ) {
      return new BadRequestException(
        `File DOCX hỏng hoặc không phải định dạng .docx.${mismatchHint(file, 'ZIP hoặc file Office (DOCX/XLSX/PPTX)')} ` +
          'Lưu ý .doc (Word 97-2003) không dùng được — hãy "Save As" sang .docx.',
      );
    }

    this.logger.error(
      `Lỗi không lường trước khi đọc DOCX: ${err instanceof Error ? err.stack : String(err)}`,
    );
    return new BadRequestException(
      'Không đọc được file DOCX này vì một lỗi không lường trước. ' +
        'Hãy thử tài liệu khác, hoặc dùng nút "Thêm câu thủ công".',
    );
  }

  // ===== TXT =====

  /**
   * `Buffer.toString('utf-8')` KHÔNG bao giờ ném lỗi — byte hỏng lặng lẽ thành U+FFFD.
   * Vì vậy phải tự phát hiện: UTF-16 thì decode lại cho đúng, nhị phân thì từ chối.
   */
  private readTxt(file: Buffer): string {
    // UTF-16 có BOM: Notepad Windows lưu "Unicode" ra kiểu này rất hay gặp
    if (file.length >= 2) {
      if (file[0] === 0xff && file[1] === 0xfe) {
        return file.subarray(2).toString('utf16le');
      }
      if (file[0] === 0xfe && file[1] === 0xff) {
        return this.decodeUtf16BE(file.subarray(2));
      }
    }

    // Bỏ BOM của UTF-8. So theo mã điểm (0xFEFF) chứ không viết ký tự BOM vào
    // source: ký tự đó vô hình trong editor và bị eslint bắt no-irregular-whitespace.
    let text = file.toString('utf-8');
    if (text.charCodeAt(0) === UTF8_BOM) text = text.slice(1);

    // UTF-16 không BOM: đặc trưng là NUL xen kẽ giữa các ký tự ASCII
    const nulCount = countChar(text, NUL);
    if (nulCount > text.length * 0.2) {
      return file.toString('utf16le').split(NUL).join('');
    }

    const replacementCount = countChar(text, '�');
    if (replacementCount > text.length * MAX_REPLACEMENT_RATIO) {
      throw new BadRequestException(
        `File .txt này không đọc được dưới dạng văn bản (${replacementCount}/${text.length} ký tự hỏng).` +
          `${mismatchHint(file, 'TXT')} ` +
          'Hãy lưu lại file với bảng mã UTF-8, hoặc dùng file PDF/DOCX.',
      );
    }
    if (nulCount > 0) {
      throw new BadRequestException(
        'File .txt này chứa dữ liệu nhị phân nên không phải file văn bản thuần.' +
          `${mismatchHint(file, 'TXT')}`,
      );
    }

    return text;
  }

  private decodeUtf16BE(buffer: Buffer): string {
    // Node không hỗ trợ 'utf16be' — đảo từng cặp byte rồi decode như utf16le
    const swapped = Buffer.from(buffer);
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      const tmp = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = tmp;
    }
    return swapped.toString('utf16le');
  }

  // ===== Chung =====

  /** Đọc được file nhưng không có chữ nào — nguyên nhân khác nhau theo định dạng */
  private noTextMessage(type: SupportedFileType): string {
    switch (type) {
      case 'pdf':
        return (
          'Đọc được file PDF nhưng không có chữ nào bên trong — nhiều khả năng đây là ảnh scan. ' +
          'Chỉ hỗ trợ PDF có chữ (bôi đen copy được), chưa hỗ trợ OCR ảnh scan.'
        );
      case 'docx':
        return 'File DOCX này không có nội dung chữ nào (có thể chỉ chứa ảnh hoặc bảng rỗng).';
      case 'txt':
        return 'File .txt này chỉ có khoảng trắng, không có nội dung.';
    }
  }

  private detectType(mimeType: string): SupportedFileType {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('wordprocessingml')) return 'docx';
    if (mimeType === 'text/plain') return 'txt';

    // Nói rõ định dạng bị từ chối thay vì chỉ liệt kê thứ được hỗ trợ
    const rejected = mimeType ? ` (bạn vừa tải lên "${mimeType}")` : '';
    throw new BadRequestException(
      `Chỉ hỗ trợ file PDF, DOCX hoặc TXT${rejected}. ` +
        'File .doc bản cũ, .odt, .xlsx hay ảnh đều không dùng được — hãy chuyển sang một trong ba định dạng trên.',
    );
  }
}

function countChar(text: string, char: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === char) count++;
  }
  return count;
}
