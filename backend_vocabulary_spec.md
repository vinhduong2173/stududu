# Tài liệu Yêu cầu & Thiết kế API Backend cho Chức năng Sổ Từ Vựng & Flashcard (SRS)

Tài liệu này tổng hợp toàn bộ thông tin chi tiết về cơ sở dữ liệu, các API RESTful, và logic xử lý nghiệp vụ cho chức năng **Sổ từ vựng (Vocabulary Notebook) & Ôn tập Flashcard** để chuyển cho lập trình viên Backend.

---

## 1. Thay đổi Database Schema (Prisma)

Cần cập nhật các Model trong file `schema.prisma` như sau:

```prisma
// 1. Cập nhật Model WordLibrary (Thư viện từ vựng chung)
model WordLibrary {
  id          Int      @id @default(autoincrement())
  term        String   @db.VarChar(100)
  languageId  Int      @map("language_id")
  phonetic    String?  // [THÊM MỚI] Phiên âm IPA (ví dụ: "/ˌser.ənˈdɪp.ə.ti/")
  partOfSpeech String? // [THÊM MỚI] Loại từ (ví dụ: "danh từ", "noun", "tính từ"...)
  definition  String?  
  example     String?
  audioUrl    String?  // [THÊM MỚI] Link audio mp3 phát âm từ điển (nếu có)
  saveCount   Int      @default(0) @map("save_count")
  isPublic    Boolean  @default(false) @map("is_public")
  updatedById Int?     @map("updated_by_id")
  createdAt   DateTime @default(now()) @map("created_at")

  language Language        @relation(fields: [languageId], references: [id])
  savedBy  UserSavedWord[]

  @@unique([term, languageId])
  @@map("word_library")
}

// 2. Cập nhật Model UserSavedWord (Sổ từ cá nhân)
model UserSavedWord {
  id            Int             @id @default(autoincrement())
  userId        Int             @map("user_id")
  wordLibraryId Int             @map("word_library_id")
  personalNote  String?         @map("personal_note")
  source        SavedWordSource // 'chat' | 'manual' (hoặc 'highlight')
  status        String          @default("learning") // [THÊM MỚI] Trạng thái từ: 'learning' (Đang học / Cần ôn) | 'mastered' (Đã thuộc)
  createdAt     DateTime        @default(now()) @map("created_at")

  user User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  word WordLibrary @relation(fields: [wordLibraryId], references: [id])

  @@unique([userId, wordLibraryId])
  @@map("user_saved_words")
}
```

---

## 2. Danh sách API RESTful Cần Thiết

### 2.1. Tra từ vựng & Phiên âm (Dictionary Lookup)
- **Endpoint**: `GET /vocabulary/lookup?term={term}&target={lang}`
- **Auth**: Optional / Required
- **Mô tả**: Tra từ qua TranslateService & Free Dictionary API, trả về dịch nghĩa + phiên âm + loại từ + ví dụ + audio URL.
- **Response mẫu**:
```json
{
  "term": "serendipity",
  "translation": "sự tình cờ may mắn",
  "detectedLang": "en",
  "languageId": 1,
  "dictionary": {
    "phonetic": "/ˌser.ənˈdɪp.ə.ti/",
    "partOfSpeech": "danh từ",
    "definition": "the occurrence and development of events by chance in a happy or beneficial way",
    "example": "a fortunate stroke of serendipity",
    "audioUrl": "https://api.dictionaryapi.dev/media/pronunciations/en/serendipity-us.mp3"
  }
}
```

---

### 2.2. Lưu từ vựng vào Sổ tay
- **Endpoint**: `POST /vocabulary/save-word`
- **Auth**: Required (Bearer JWT)
- **Request Body**:
```json
{
  "term": "serendipity",
  "languageId": 1,
  "phonetic": "/ˌser.ənˈdɪp.ə.ti/",
  "partOfSpeech": "danh từ",
  "definition": "sự tình cờ may mắn",
  "example": "a fortunate stroke of serendipity",
  "audioUrl": "https://...",
  "personalNote": "",
  "source": "manual"
}
```
- **Logic xử lý**:
  1. Kiểm tra/Tạo mới trong bảng `WordLibrary` (lưu cả `phonetic`, `partOfSpeech`, `audioUrl`).
  2. Tạo bản ghi trong `UserSavedWord` với `status = "learning"` (mặc định là **Đang học**).
  3. Trả về object từ đã lưu.

---

### 2.3. Lấy danh sách từ vựng cá nhân
- **Endpoint**: `GET /vocabulary/my-words`
- **Auth**: Required (Bearer JWT)
- **Query Params**:
  - `status`: Optional (`learning` | `mastered`) - Lọc theo trạng thái.
  - `search`: Optional (`string`) - Tìm kiếm từ hoặc ghi chú.
- **Response mẫu**:
```json
[
  {
    "id": 101,
    "userId": 1,
    "wordLibraryId": 5,
    "personalNote": "Từ hay trong chat",
    "source": "chat",
    "status": "learning",
    "createdAt": "2026-07-22T10:00:00.000Z",
    "word": {
      "id": 5,
      "term": "serendipity",
      "phonetic": "/ˌser.ənˈdɪp.ə.ti/",
      "partOfSpeech": "danh từ",
      "definition": "sự tình cờ may mắn",
      "example": "a fortunate stroke of serendipity",
      "audioUrl": "https://...",
      "saveCount": 6,
      "isPublic": true,
      "language": {
        "id": 1,
        "code": "en",
        "name": "GB English"
      }
    }
  }
]
```

---

### 2.4. Cập nhật Trạng thái Ôn tập từ vựng (Chuyển "Cần ôn" ↔ "Đã thuộc")
- **Endpoint**: `PATCH /vocabulary/my-words/:id/status`
- **Auth**: Required (Bearer JWT)
- **Request Body**:
```json
{
  "status": "mastered" // hoặc "learning"
}
```
- **Response mẫu**:
```json
{
  "id": 101,
  "status": "mastered",
  "updatedAt": "2026-07-22T11:00:00.000Z"
}
```

---

### 2.5. Xóa từ vựng khỏi Sổ tay
- **Endpoint**: `DELETE /vocabulary/my-words/:id`
- **Auth**: Required (Bearer JWT)
- **Response**: `{ "deleted": 101 }`

---

## 3. Quy tắc Nghiệp vụ Quiz Trắc Nghệm (Multiple Choice Quiz Business Logic)

1. **Khởi tạo trạng thái**: Tất cả các từ khi được thêm vào Sổ từ vựng (qua bôi đen dịch từ hoặc chat) mặc định có `status = "learning"` (**Đang học / Cần ôn**).
2. **Cơ chế câu hỏi Quiz Trắc Nghiệm**:
   - Thay thế thẻ Flashcard tự chọn bằng **Quiz 4 lựa chọn (Multiple Choice)**: Cho Từ vựng tiếng Anh (Term + Audio + Phonetic) $\rightarrow$ Chọn 1 trong 4 Nghĩa tiếng Việt.
   - **Tạo đáp án nhiễu (Distractors)**: 1 đáp án đúng là nghĩa của từ + 3 đáp án sai được lấy ngẫu nhiên từ nghĩa của các từ khác trong Sổ từ vựng / Từ điển hệ thống.
3. **Quy tắc chuyển đổi Trạng thái & Chấm điểm**:
   - **Trả lời ĐÚNG**:
     - Frontend gọi `PATCH /vocabulary/my-words/:id/status` với `{ "status": "mastered" }`.
     - Từ vựng được đánh dấu **"Đã thuộc"** (`mastered`) và sẽ không xuất hiện trong các lượt làm Quiz "Ôn từ chưa thuộc" tiếp theo.
     - Tăng điểm câu đúng của lượt Quiz.
   - **Trả lời SAI**:
     - Từ vựng **giữ nguyên** `status = "learning"`.
     - **Không đẩy từ bị sai xuống cuối hàng chờ lượt hiện tại** (để giữ nguyên điểm số chính xác của phiên làm bài).
     - Từ này sẽ tiếp tục được đưa vào danh sách câu hỏi ở các lần làm Quiz tiếp theo cho đến khi người dùng chọn đúng.
4. **Chế độ Ôn tập**:
   - **"Ôn từ chưa thuộc" (`learning_only`)**: Lấy toàn bộ các từ có `status !== "mastered"`.
   - **"Ôn toàn bộ" (`all`)**: Lấy tất cả từ vựng trong sổ tay không phân biệt trạng thái.
5. **Tổng kết lượt làm (Quiz Summary)**:
   - Khi làm xong tất cả các câu hỏi trong lượt, hiển thị kết quả: Điểm số, phần trăm chính xác (Accuracy %), số từ thuộc mới, và danh sách các từ trả lời sai cần ôn tiếp.

