import { BadRequestException } from '@nestjs/common';
import { FileExtractorService, MAX_FILE_BYTES } from './file-extractor.service';
import {
  buildDocx,
  buildEncryptedPdf,
  buildImageOnlyPdf,
  buildLongTextPdf,
  buildTextPdf,
  buildTruncatedPdf,
  buildZipWithoutDocument,
  JPEG_BYTES,
  LEGACY_DOC_BYTES,
  LONG_PARAGRAPHS,
  PNG_BYTES,
} from './__fixtures__/document-fixtures';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const TXT_MIME = 'text/plain';

/** Bắt lỗi và trả về message để so khớp — mọi lỗi phải là BadRequestException */
async function expectRejection(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    const response = (err as BadRequestException).getResponse();
    return typeof response === 'string'
      ? response
      : String((response as { message?: string }).message);
  }
  throw new Error('Đáng lẽ phải ném lỗi nhưng lại chạy thành công');
}

describe('FileExtractorService', () => {
  const service = new FileExtractorService();

  // Suy nghĩ ở đây: mỗi nguyên nhân hỏng phải cho ra MỘT thông báo riêng.
  // Test so khớp vào từ khoá đặc trưng của từng thông báo — nếu ai đó gộp lại
  // thành một câu chung chung thì test này gãy, đúng như mong muốn.

  describe('kiểm tra chung trước khi đọc', () => {
    it('từ chối file rỗng 0 byte', async () => {
      const message = await expectRejection(
        service.extract(Buffer.alloc(0), PDF_MIME),
      );
      expect(message).toContain('rỗng (0 byte)');
    });

    it('từ chối file vượt quá 5MB, kèm số MB thực tế', async () => {
      const oversized = Buffer.alloc(MAX_FILE_BYTES + 1024, 0x41);
      const message = await expectRejection(
        service.extract(oversized, TXT_MIME),
      );
      expect(message).toContain('File quá lớn');
      expect(message).toContain('5MB');
    });

    it('từ chối mimetype lạ và nói rõ mimetype vừa nhận', async () => {
      const message = await expectRejection(
        service.extract(Buffer.from('abc'), 'application/vnd.ms-excel'),
      );
      expect(message).toContain('Chỉ hỗ trợ file PDF, DOCX hoặc TXT');
      expect(message).toContain('application/vnd.ms-excel');
    });

    it('từ chối ảnh gửi lên với mimetype ảnh', async () => {
      const message = await expectRejection(
        service.extract(PNG_BYTES, 'image/png'),
      );
      expect(message).toContain('image/png');
    });
  });

  describe('PDF', () => {
    it('đọc được PDF có chữ và bỏ marker phân trang của pdf-parse', async () => {
      const result = await service.extract(
        buildTextPdf(LONG_PARAGRAPHS),
        PDF_MIME,
      );

      expect(result.text).toContain('Gia dinh la don vi co ban cua xa hoi');
      expect(result.charCount).toBeGreaterThanOrEqual(200);
      expect(result.truncated).toBe(false);
      // pdf-parse mặc định chèn "-- 1 of 1 --" cuối mỗi trang; nếu lọt vào đây
      // thì nó sẽ đi thẳng vào prompt AI như thể là nội dung tài liệu
      expect(result.text).not.toMatch(/--\s*\d+\s*of\s*\d+\s*--/);
    });

    it('cắt ở 8000 ký tự và đánh dấu truncated', async () => {
      const result = await service.extract(buildLongTextPdf(10_000), PDF_MIME);

      expect(result.truncated).toBe(true);
      expect(result.text.length).toBe(8000);
      expect(result.charCount).toBeGreaterThan(8000);
    });

    it('PDF nhiều trang: nối liền nội dung, không chèn marker giữa các trang', async () => {
      // 100 dòng ngắn ~ 3 trang. Đây mới là case marker "-- 2 of 3 --" thật sự
      // xuất hiện nếu quên tắt pageJoiner. Dòng phải ngắn để không bị fixture cắt
      // ở mép phải trang, nếu không phần đánh dấu cuối dòng biến mất.
      const lines = Array.from(
        { length: 100 },
        (_, i) => `Cau so ${i} trong tai lieu`,
      );
      const result = await service.extract(buildTextPdf(lines), PDF_MIME);

      expect(result.text).not.toMatch(/--\s*\d+\s*of\s*\d+\s*--/);
      // Dòng đầu trang 1, giữa trang 2 và trang 3 — chứng minh nội dung nối liền
      expect(result.text).toContain('Cau so 0 trong tai lieu');
      expect(result.text).toContain('Cau so 50 trong tai lieu');
      expect(result.text).toContain('Cau so 90 trong tai lieu');
    });

    it('PDF ảnh scan (không có chữ) → báo đúng là ảnh scan, không phải "file hỏng"', async () => {
      const message = await expectRejection(
        service.extract(buildImageOnlyPdf(), PDF_MIME),
      );
      expect(message).toContain('ảnh scan');
      expect(message).not.toContain('hỏng');
    });

    it('PDF có mật khẩu → báo đặt mật khẩu, hướng dẫn cách gỡ', async () => {
      const message = await expectRejection(
        service.extract(buildEncryptedPdf(), PDF_MIME),
      );
      expect(message).toContain('mật khẩu');
      expect(message).toContain('Save As');
    });

    it('PDF cụt/hỏng cấu trúc → báo hỏng định dạng', async () => {
      const message = await expectRejection(
        service.extract(buildTruncatedPdf(), PDF_MIME),
      );
      expect(message).toContain('hỏng hoặc không đúng định dạng PDF');
    });

    it('ảnh PNG đổi đuôi .pdf → chỉ đích danh file thật là PNG', async () => {
      const message = await expectRejection(
        service.extract(PNG_BYTES, PDF_MIME),
      );
      expect(message).toContain('thật ra là PNG');
      expect(message).toContain('đổi đuôi');
    });

    it('DOCX đổi đuôi .pdf → chỉ đích danh là file Office', async () => {
      const docx = await buildDocx(LONG_PARAGRAPHS);
      const message = await expectRejection(service.extract(docx, PDF_MIME));
      expect(message).toContain('file Office');
    });

    it('PDF quá ngắn → nói rõ số ký tự đọc được và ngưỡng tối thiểu', async () => {
      const message = await expectRejection(
        service.extract(buildTextPdf(['Chi vai chu.']), PDF_MIME),
      );
      expect(message).toContain('quá ngắn');
      expect(message).toContain('200 ký tự');
    });
  });

  describe('DOCX', () => {
    it('đọc được DOCX hợp lệ', async () => {
      const result = await service.extract(
        await buildDocx(LONG_PARAGRAPHS),
        DOCX_MIME,
      );
      expect(result.text).toContain('Gia dinh la don vi co ban');
      expect(result.charCount).toBeGreaterThanOrEqual(200);
    });

    it('zip hợp lệ nhưng không phải Word → gợi ý Save As sang .docx', async () => {
      const message = await expectRejection(
        service.extract(await buildZipWithoutDocument(), DOCX_MIME),
      );
      expect(message).toContain('không phải tài liệu Word');
      expect(message).toContain('.docx');
    });

    it('PDF đổi đuôi .docx → báo không phải .docx và chỉ đích danh PDF', async () => {
      const message = await expectRejection(
        service.extract(buildTextPdf(LONG_PARAGRAPHS), DOCX_MIME),
      );
      expect(message).toContain('không phải định dạng .docx');
      expect(message).toContain('thật ra là PDF');
    });

    it('file .doc bản cũ (OLE2) → nói rõ .doc không dùng được', async () => {
      const message = await expectRejection(
        service.extract(LEGACY_DOC_BYTES, DOCX_MIME),
      );
      expect(message).toContain('Word 97-2003');
      expect(message).toContain('Word bản cũ (.doc)');
    });

    it('ảnh JPEG đổi đuôi .docx → chỉ đích danh JPEG', async () => {
      const message = await expectRejection(
        service.extract(JPEG_BYTES, DOCX_MIME),
      );
      expect(message).toContain('thật ra là JPEG');
    });

    it('DOCX không có chữ nào → báo không có nội dung, không nói "hỏng"', async () => {
      const message = await expectRejection(
        service.extract(await buildDocx([]), DOCX_MIME),
      );
      expect(message).toContain('không có nội dung chữ nào');
    });
  });

  describe('TXT', () => {
    const longText = LONG_PARAGRAPHS.join(' ');

    it('đọc được UTF-8 kèm dấu tiếng Việt', async () => {
      const text = 'Gia đình là đơn vị cơ bản của xã hội. '.repeat(8);
      const result = await service.extract(
        Buffer.from(text, 'utf-8'),
        TXT_MIME,
      );
      expect(result.text).toContain('Gia đình là đơn vị cơ bản');
      expect(result.text).not.toContain('�');
    });

    it('bỏ BOM của UTF-8 thay vì để lọt vào prompt', async () => {
      const withBom = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from(longText, 'utf-8'),
      ]);
      const result = await service.extract(withBom, TXT_MIME);
      expect(result.text.startsWith('﻿')).toBe(false);
      expect(result.text.startsWith('Gia dinh')).toBe(true);
    });

    it('tự decode UTF-16 LE có BOM (Notepad lưu kiểu "Unicode")', async () => {
      const utf16 = Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(longText, 'utf16le'),
      ]);
      const result = await service.extract(utf16, TXT_MIME);
      expect(result.text).toContain('Gia dinh la don vi co ban');
      expect(result.text).not.toContain('�');
    });

    it('tự decode UTF-16 BE có BOM', async () => {
      const le = Buffer.from(longText, 'utf16le');
      const be = Buffer.from(le);
      for (let i = 0; i + 1 < be.length; i += 2) {
        [be[i], be[i + 1]] = [be[i + 1], be[i]];
      }
      const result = await service.extract(
        Buffer.concat([Buffer.from([0xfe, 0xff]), be]),
        TXT_MIME,
      );
      expect(result.text).toContain('Gia dinh la don vi co ban');
    });

    it('tự decode UTF-16 LE KHÔNG có BOM (nhiều byte NUL xen kẽ)', async () => {
      const result = await service.extract(
        Buffer.from(longText, 'utf16le'),
        TXT_MIME,
      );
      expect(result.text).toContain('Gia dinh la don vi co ban');
    });

    it('file nhị phân đổi đuôi .txt → báo không đọc được kèm số ký tự hỏng', async () => {
      const binary = Buffer.concat(
        Array.from({ length: 60 }, () =>
          Buffer.from([0x89, 0xff, 0xfe, 0xfd, 0x80]),
        ),
      );
      const message = await expectRejection(service.extract(binary, TXT_MIME));
      expect(message).toContain('không đọc được dưới dạng văn bản');
      expect(message).toContain('UTF-8');
    });

    it('chịu được vài byte hỏng lẻ tẻ trong file dài, không từ chối oan', async () => {
      // 1 byte hỏng giữa hàng trăm ký tự sạch — dưới ngưỡng 5%
      const mostlyClean = Buffer.concat([
        Buffer.from(longText, 'utf-8'),
        Buffer.from([0xff]),
        Buffer.from(longText, 'utf-8'),
      ]);
      const result = await service.extract(mostlyClean, TXT_MIME);
      expect(result.charCount).toBeGreaterThan(200);
    });

    it('file .txt chỉ có khoảng trắng → báo không có nội dung', async () => {
      const message = await expectRejection(
        service.extract(Buffer.from('   \n\t  \r\n   '), TXT_MIME),
      );
      expect(message).toContain('chỉ có khoảng trắng');
    });

    it('file .txt quá ngắn → báo số ký tự và ngưỡng', async () => {
      const message = await expectRejection(
        service.extract(Buffer.from('Ngan qua.'), TXT_MIME),
      );
      expect(message).toContain('quá ngắn');
      expect(message).toContain('9 ký tự');
    });
  });
});
