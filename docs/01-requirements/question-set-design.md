# Thiết kế — Bộ đề theo chủ đề & luồng Admin soạn đề

**Người lập:** Vinh (BA) · **Ngày:** 28/07/2026 · **Trạng thái:** Draft — khôi phục sau sự cố mất file khi đổi nhánh (03/08/2026). **Phần nhập CSV trong tài liệu này đã bị thay thế bởi [`question-set-ai-only-flow.md`](question-set-ai-only-flow.md)** — đọc tài liệu đó cho luồng nhập câu hỏi hiện hành.

**Bối cảnh:** flashcard lấy từ chat đã chạy ổn. Đây là **chế độ học thứ hai**: bộ đề trắc nghiệm do Admin soạn, phân theo chủ đề từ vựng và trình độ (ví dụ *"Động vật · B1"*).

---

## 1. Quyết định đã chốt (28/07)

| Nội dung | Chốt |
|---|---|
| Số câu mỗi bộ | **Đúng 20 câu** |
| Giới hạn làm bài | **3 bộ/ngày** |
| Lưu lịch sử làm bài | **Tất cả các lần** (không chỉ lần cao nhất) |
| Từ trong bộ đề vào sổ từ vựng | **Có** — nối vào chu kỳ ôn SM-2 |
| Bản theo ngôn ngữ mẹ đẻ | **Một bộ dùng chung**, giai đoạn đầu chỉ làm **tiếng Anh ↔ tiếng Việt** |
| Người soạn đề | **Admin**, nạp trực tiếp trên web |

## 2. Chủ đề từ vựng — bảng RIÊNG, không dùng lại `Topic`

`Topic` hiện có đang seed *Du lịch, Âm nhạc, Phim ảnh, Ẩm thực, Thể thao, Công nghệ, Sách, Game, Văn hóa, Thi cử* — đây là **sở thích để ghép người nói chuyện**, không phải trường từ vựng.

Hai lý do phải tách:

- Khác bản chất: `Topic` = *"tôi thích nói về chủ đề này"*; chủ đề từ vựng = *"nhóm nghĩa của từ"* (động vật, thức ăn, nghề nghiệp...)
- `Topic.hidden` gắn với US-21 (Admin ẩn chủ đề khỏi hồ sơ & bộ lọc matching). Dùng chung thì Admin ẩn một chủ đề để dọn matching sẽ **vô tình làm mất bộ đề**.

## 3. Dữ liệu

```prisma
model VocabTopic {
  id     Int     @id @default(autoincrement())
  name   String  @unique
  hidden Boolean @default(false)

  sets QuestionSet[]

  @@map("vocab_topics")
}

model QuestionSet {
  id              Int       @id @default(autoincrement())
  languageId      Int       @map("language_id")
  topicId         Int       @map("topic_id")
  framework       String                               // CEFR | HSK | JLPT | TOPIK
  level           String                               // A1..C2
  levelOrder      Int       @map("level_order")        // 1..6 — so sánh/lên bậc
  title           String
  description     String?
  contentLanguage String    @default("vi") @map("content_language")
  status          SetStatus @default(draft)
  questionCount   Int       @default(0) @map("question_count")
  createdById     Int       @map("created_by_id")
  updatedById     Int?      @map("updated_by_id")
  publishedAt     DateTime? @map("published_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  language  Language       @relation(fields: [languageId], references: [id])
  topic     VocabTopic     @relation(fields: [topicId], references: [id])
  questions TestQuestion[]
  attempts  TestAttempt[]

  @@unique([languageId, topicId, level])
  @@index([status, languageId, levelOrder])
  @@map("question_sets")
}

model TestQuestion {
  id          Int            @id @default(autoincrement())
  setId       Int            @map("set_id")
  orderIndex  Int            @map("order_index")
  type        QuestionType
  term        String?
  passage     String?
  prompt      String
  options     String[]
  answerIndex Int            @map("answer_index")
  explanation String?
  status      QuestionStatus @default(active)
  source      QuestionSource @default(manual)          // xem question-set-ai-only-flow.md mục 6
  sourceMeta  Json?
  createdAt   DateTime       @default(now()) @map("created_at")

  set     QuestionSet  @relation(fields: [setId], references: [id], onDelete: Cascade)
  answers TestAnswer[]

  @@index([setId, status])
  @@map("test_questions")
}

model TestAttempt {
  id           Int       @id @default(autoincrement())
  userId       Int       @map("user_id")
  setId        Int       @map("set_id")
  totalCount   Int       @default(20) @map("total_count")
  correctCount Int       @default(0)  @map("correct_count")
  startedAt    DateTime  @default(now()) @map("started_at")
  finishedAt   DateTime? @map("finished_at")

  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  set     QuestionSet  @relation(fields: [setId], references: [id])
  answers TestAnswer[]

  @@index([userId, startedAt])
  @@index([userId, setId])
  @@map("test_attempts")
}

model TestAnswer {
  id          Int     @id @default(autoincrement())
  attemptId   Int     @map("attempt_id")
  questionId  Int     @map("question_id")
  chosenIndex Int?    @map("chosen_index")
  isCorrect   Boolean @map("is_correct")

  attempt  TestAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question TestQuestion @relation(fields: [questionId], references: [id])

  @@unique([attemptId, questionId])
  @@map("test_answers")
}

enum SetStatus      { draft  published  archived }
enum QuestionType   { vocabulary  grammar  cloze  reading }
enum QuestionStatus { active  retired }
enum QuestionSource { manual  ai_generated }
```

**`@@unique([languageId, topicId, level])`** — một (ngôn ngữ, chủ đề, trình độ) chỉ có một bộ đề. Nếu muốn nhiều bộ thì phải bỏ ràng buộc này (xem mục 8).

## 4. Cửa publish — hai điều kiện

Bộ đề chỉ publish được khi:

1. **Đủ đúng 20 câu** `status = active`
2. **Admin đã làm thử ít nhất một lần, và lượt đó phải phủ hết bộ câu đang dùng**

Điều kiện 2 bắt được thứ máy không kiểm được: đáp án đúng bị đánh sai vị trí, nhiễu quá dễ đoán, độ khó không đúng trình độ, câu hỏi tối nghĩa. Người học **chỉ thấy bộ `published`**.

**Làm rõ 05/08 — "phủ hết bộ câu đang dùng" nghĩa là gì.** Chỉ đếm "đã từng có một lượt làm thử" là chưa đủ: Admin làm thử lúc bộ mới có 3 câu, thêm nốt 17 câu rồi publish thì 17 câu đó lên sóng mà chưa ai đọc — đúng thứ điều kiện 2 sinh ra để chặn. Nên `getPublishGate` chỉ nhận lượt làm thử mà `questionOrder` của nó **chứa toàn bộ id câu `active` hiện tại**; thay hay thêm câu sau khi làm thử đều làm lượt cũ hết hiệu lực và cờ `trialOutdated` bật lên để FE nói rõ phải làm thử lại.

**Trần 20 câu được chặn ngay từ lúc thêm.** Điều kiện 1 là "đúng 20", không phải "≥20", nên mọi đường thêm câu (nhập hàng loạt sau khi AI sinh lẫn form nhập tay) đều bị chặn nếu vượt trần. Không chặn thì bộ 25 câu kẹt vĩnh viễn: không bao giờ publish được mà khung "còn N chỗ" ở FE cũng đã biến mất nên Admin không thấy đường sửa.

## 5. Sửa bộ đã publish

| Loại sửa | Cho phép? |
|---|---|
| Sửa chính tả, `prompt`, `explanation` | ✅ Cho, kèm cảnh báo |
| Sửa **đáp án đúng** của câu **đã có người trả lời** | ❌ Không — điểm đã chấm trở nên vô nghĩa |
| Xoá câu đã có người trả lời | ❌ Chuyển `retired`, không xoá cứng |

Khi cần sửa đáp án đúng: `retired` câu cũ + thêm câu mới thay thế.

## 6. Nối với sổ từ vựng

Sau khi hoàn thành một bộ, hiện nút **"Lưu tất cả vào sổ từ vựng"** — lưu qua `WordLibrary` (dedupe) + `UserSavedWord` (`source = manual`). Từ trả lời sai → `nextReviewAt = hôm nay` để vào ngay chu kỳ SM-2.

⚠️ **Xem mục 8 — điểm này đang xung đột với thiết kế `DAILY_VOCABULARY_SPEC.md`.**

## 7. Phía người học

| Hạng mục | Thiết kế |
|---|---|
| Danh sách bộ đề | Lọc theo ngôn ngữ · chủ đề · trình độ. Hiện tiến độ |
| Hạn mức | 3 bộ/ngày, reset theo timezone |
| Làm bài | 20 câu, **đảo thứ tự câu và đáp án mỗi lần làm** |
| Lịch sử | Lưu tất cả các lượt |
| Xếp lớp | Điểm ≥80% → gợi ý lên bậc; <50% → gợi ý lùi. Chỉ gợi ý |
| Xếp hạng | **Có, nhưng chỉ trong phạm vi một thử thách** — xem mục 7b |

## 7b. Thử thách cộng đồng & bảng xếp hạng (chốt 04/08/2026)

**Thay đổi so với bản trước:** mục 7 ban đầu ghi *"Xếp hạng: Không có"*. Yêu cầu bổ sung ngày 04/08 là có phần **thi đấu ở Community**, nên quyết định được nới lại như sau — ghi rõ ở đây để người review sau không coi là vi phạm BR-13.

| Nội dung | Chốt |
|---|---|
| Hình thức | **Thử thách bất đồng bộ**: Admin mở một bộ đề đã publish thành thử thách có `startsAt`/`endsAt`; ai làm lúc nào cũng được trong khoảng đó. **Không** đấu 1v1 realtime. |
| Số lượt | **Mỗi người 1 lượt / thử thách** (`@@unique([userId, challengeId])`) — có 2 lượt thì bảng xếp hạng mất ý nghĩa |
| Cách xếp hạng | Số câu đúng giảm dần → hoà thì ai hoàn thành nhanh hơn đứng trên. Thời gian **tính lại khi đọc** (`finishedAt − startedAt`), không lưu sẵn |
| Phạm vi | Bảng xếp hạng **chỉ tồn tại trong màn thử thách**. Không có điểm tích luỹ trên hồ sơ, không có cấp bậc/rank toàn hệ thống, không có huy hiệu |
| Quan hệ với BR-13 | **Không vi phạm.** BR-13 cấm điểm trung bình/xếp hạng cho *Endorsement* (đánh giá con người). Xếp hạng ở đây là kết quả của một bài kiểm tra khách quan, sống trong đúng một thử thách rồi thôi — không trở thành thước đo thường trực gắn với người dùng |
| Ranh giới không được vượt | Không đưa thứ hạng/điểm số lên profile, card gợi ý, hay thuật toán matching. Nếu sau này ai đó muốn làm "level toàn hệ thống", đó là quyết định sản phẩm mới, phải chốt lại — không phải mở rộng tự nhiên của mục này |

## 8. Xung đột & rủi ro phát hiện ngày 03/08 — cần xử lý trước khi code tiếp

1. **`feat/test-generator`** đã có sẵn "admin test creation proposal" + "replace flashcards with interactive quiz" — khả năng cao trùng phạm vi với thiết kế này. Cần đối chiếu trước khi 2 nhánh cùng phát triển độc lập.
2. **`WordLibrary` schema hiện tại** vẫn giữ `definition/example/isPublic` (chưa gỡ theo quyết định ở `feature-design-v2.md` mục 1). `DAILY_VOCABULARY_SPEC.md` (mới, 31/07) đang xây trên đúng cấu trúc cũ này (upsert `WordLibrary` với definition/phonetic, dùng làm "từ nổi bật" công khai). Hai thiết kế **mâu thuẫn trực tiếp** — cần chốt lại một trong hai trước khi cả hai cùng động vào `WordLibrary`.
3. `feat/test-generator` lệch ~15.000 dòng so với `develop` — rủi ro merge cao nếu không rebase trước.

## 9. Việc cần chốt

1. ~~Mỗi (chủ đề × trình độ) chỉ **một** bộ đề~~ → **đã chốt 04/08: giữ `@@unique([languageId, topicId, level])`**, một tổ hợp một bộ. Muốn nhiều bộ thì phải bỏ ràng buộc này và sửa lại migration.
2. Người học có làm được bộ đề của ngôn ngữ mình **không** khai đang học không? → **tạm để mở (04/08): hiện KHÔNG lọc theo ngôn ngữ người học đang học** — ai cũng thấy mọi bộ đã publish. Nếu muốn siết, thêm điều kiện ở `AttemptsService.listPublishedSets`.
3. Xem mục 8 — ba việc cần xử lý trước khi giao thêm việc code. **Vẫn còn nguyên**, đặc biệt điểm 2 (xung đột `WordLibrary`): phần "Lưu tất cả vào sổ từ vựng" ở mục 6 **chưa được triển khai** chính vì xung đột này.

## 10. Tài liệu liên quan

- [`question-set-ai-only-flow.md`](question-set-ai-only-flow.md) — luồng nhập câu hỏi hiện hành (AI + nhập tay), thay thế phần CSV
- [`question-set-ai-generation-addendum.md`](question-set-ai-generation-addendum.md) — prompt AI, toggle xem trước
- [`feature-design-v2.md`](feature-design-v2.md) — quyết định sản phẩm gốc, mục 1 (sổ từ vựng — đang xung đột, xem mục 8)
- [`api-contract-convention.md`](../04-convention/api-contract-convention.md) — envelope, quy ước contract
