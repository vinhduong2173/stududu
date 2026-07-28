# Kế hoạch Thiết kế & Nâng cấp Backend cho Chức năng Sổ Từ Vựng & Ôn Tập Flashcard (SRS)

Kế hoạch này chi tiết hóa các bước cập nhật cơ sở dữ liệu (Prisma Schema), nâng cấp module `vocabulary`, tích hợp API tra từ điển (Free Dictionary API + TranslateService), cũng như đảm bảo toàn bộ API tương thích hoàn toàn với giao diện Frontend mới mà không làm gián đoạn các tính năng hiện có.

---

## User Review Required

> [!IMPORTANT]
> **Thay đổi Schema Prisma**:
> - Cần thêm các trường `phonetic`, `partOfSpeech`, `audioUrl` vào model `WordLibrary`.
> - Cần thêm trường `status` (mặc định `'learning'`) vào model `UserSavedWord`.
> - Cần chạy `npx prisma generate` (và `npx prisma db push` hoặc `prisma migrate dev` tùy môi trường DB).

> [!NOTE]
> **Tương thích với Frontend**:
> Frontend hiện tại gọi các endpoint:
> 1. `GET /vocabulary/lookup?term={term}&target={targetLang}`
> 2. `POST /vocabulary/save-word`
> 3. `GET /vocabulary/my-words` (hỗ trợ lọc `status` & `search`)
> 4. `PATCH /vocabulary/my-words/:id/status` (cập nhật trạng thái `learning` / `mastered`)
> 5. `DELETE /vocabulary/my-words/:id`
> 
> Backend sẽ đáp ứng 100% hợp đồng API này đồng thời duy trì các API cũ (`GET /vocabulary/library`, `PATCH /vocabulary/library/:id`).

---

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.prisma](file:///f:/stududu/backend/prisma/schema.prisma)
- Cập nhật model `WordLibrary`:
  - `phonetic String?`
  - `partOfSpeech String?`
  - `audioUrl String?`
- Cập nhật model `UserSavedWord`:
  - `status String @default("learning")` // 'learning' | 'mastered'

---

### Module Vocabulary (`backend/src/modules/vocabulary`)

#### [MODIFY] [save-word.dto.ts](file:///f:/stududu/backend/src/modules/vocabulary/dto/save-word.dto.ts)
- Bổ sung các trường vào `SaveWordDto`:
  - `phonetic?: string`
  - `partOfSpeech?: string`
  - `definition?: string`
  - `example?: string`
  - `audioUrl?: string`
- Thêm `UpdateStatusDto`:
  - `status: 'learning' | 'mastered'`
- Thêm `QueryMyWordsDto`:
  - `status?: 'learning' | 'mastered'`
  - `search?: string`
- Thêm `LookupDto`:
  - `term: string`
  - `target?: string`

#### [MODIFY] [vocabulary.service.ts](file:///f:/stududu/backend/src/modules/vocabulary/vocabulary.service.ts)
- Bổ sung `lookup(term: string, targetLang: string = 'vi')`:
  - Gọi `TranslateService.translate` để lấy bản dịch nghĩa tiếng Việt/ngôn ngữ đích.
  - Gọi Free Dictionary API (`https://api.dictionaryapi.dev/api/v2/entries/en/{term}`) để lấy IPA (`phonetic`), loại từ (`partOfSpeech`), định nghĩa tiếng Anh (`definition`), ví dụ (`example`), và link âm thanh (`audioUrl`).
  - Tra cứu trong `WordLibrary` đã có để lấy thông tin thư viện cộng đồng (số người đã lưu `saveCount`, định nghĩa đóng góp).
  - Trả về cấu trúc JSON chuẩn `LookupResult`.
- Cập nhật `saveWord(userId, dto)`:
  - Lưu đầy đủ `phonetic`, `partOfSpeech`, `definition`, `example`, `audioUrl` vào `WordLibrary` nếu tạo mới hoặc bổ sung nếu chưa có.
  - Ghi bản ghi vào `UserSavedWord` với `status: 'learning'`.
- Cập nhật `myWords(userId, query)`:
  - Hỗ trợ lọc theo `status` (`learning` / `mastered`) và tìm kiếm theo `search` (tìm trong term, definition, personalNote).
- Thêm `updateStatus(userId, id, dto)`:
  - Kiểm tra quyền sở hữu bản ghi `UserSavedWord` và cập nhật `status`.

#### [MODIFY] [vocabulary.controller.ts](file:///f:/stududu/backend/src/modules/vocabulary/vocabulary.controller.ts)
- Thêm Route `GET /vocabulary/lookup` (`lookup(@Query() query: LookupDto)`).
- Cập nhật Route `GET /vocabulary/my-words` (`myWords(@CurrentUser() user, @Query() query: QueryMyWordsDto)`).
- Thêm Route `PATCH /vocabulary/my-words/:id/status` (`updateStatus(@CurrentUser() user, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto)`).
- Giữ nguyên các Route hiện có (`POST save-word`, `DELETE my-words/:id`, `GET library`, `PATCH library/:id`).

#### [MODIFY] [vocabulary.module.ts](file:///f:/stududu/backend/src/modules/vocabulary/vocabulary.module.ts)
- Import `TranslateModule` vào `VocabularyModule` để tái sử dụng dịch thuật.

---

## Verification Plan

### Automated Tests
- Chạy TypeScript compiler test trong Backend:
  ```bash
  cd f:\stududu\backend
  npm run build
  ```
- Chạy Prisma CLI validate:
  ```bash
  cd f:\stududu\backend
  npx prisma validate
  ```

### Manual Verification
- Kiểm tra tính hợp lệ của DTO & Schema qua build test.
- Đảm bảo Backend khởi động không có lỗi dependency injection hay thiếu provider.
