# Thiết kế tính năng v2 — hướng "học cùng người thật"

**Người lập:** Vinh (BA) · **Ngày:** 26/07/2026 · **Phiên bản:** 2.0 (đã chốt các quyết định ngày 26/07)

**Phạm vi:** chi tiết hoá 5 tính năng đã chốt. Tài liệu này là đầu vào để viết User Story.

**Ưu tiên:** ① Bài test trắc nghiệm · ② Audio call · ③ Community + dịch · ④ Trò chơi 2 người · ⑤ Chứng chỉ profile

---

## 0. Đối chiếu với code hiện có

Phần lớn hạ tầng đã có sẵn — việc thật nhỏ hơn cảm giác ban đầu:

| Hạng mục | Đã có trong code | Việc phải làm |
|---|---|---|
| Gom từ trùng trong DB | ✅ `WordLibrary` có `@@unique([term, languageId])` | **Không cần làm gì** |
| Bỏ thư viện chung | Có `isPublic`, `saveCount`, `GET /library`, `PATCH /library/:id` | Gỡ bỏ |
| Ngữ cảnh câu gốc | ✅ `UserSavedWord.contextSentence` | Dùng ở UI |
| Ôn tập giãn cách SM-2 | ✅ `repetitions`, `easeFactor`, `nextReviewAt` | Nối với bài test |
| Streak / phiên học | ✅ `StudySession` + `GET /vocabulary/streak` | Đã chạy |
| Đăng bài tự do | ✅ `ActivityPostType.user_post` | Thêm khung bài + dịch |
| 8 ngôn ngữ, khung CEFR | ✅ `seed.ts` đã seed 8 ngôn ngữ, `framework = 'CEFR'` | Dùng cho bài test |
| Ngân hàng câu hỏi CEFR | ❌ | **Việc lớn nhất — xem mục 2** |
| Trò chơi 2 người | ❌ | Thiết kế mới |
| Chứng chỉ profile | ❌ | 1 field, rất rẻ |
| Audio call | ❌ | WebRTC |

**Nợ kỹ thuật:** tồn tại **hai model song song** cho cùng một việc — `VocabWord` (có `fromPartner`) và `WordLibrary` + `UserSavedWord`. `vocabulary.service.ts` chỉ dùng model thứ hai → `VocabWord` nhiều khả năng là **code chết**. Xác nhận với dev rồi xoá.

---

## 1. Sổ từ vựng — chỉ giữ dedupe

### 1.1. Quyết định

- `WordLibrary` chỉ đóng vai trò **sổ đăng ký từ**: mỗi (từ + ngôn ngữ) lưu đúng một dòng để không trùng lặp.
- **Bỏ thư viện từ công khai** — không còn trang duyệt từ cộng đồng, không còn cơ chế "đủ 3 người lưu thì công khai".
- **Không lưu nghĩa/ví dụ trong `WordLibrary`.** Nghĩa lấy từ nguồn sẵn có bên ngoài (Google Translate) khi cần; ghi chú riêng nằm ở `UserSavedWord.personalNote`.

### 1.2. Cấu trúc sau khi gọn lại

```
WordLibrary      term + languageId          ← chỉ để dedupe, không chứa nội dung
UserSavedWord    personalNote               ← nghĩa/ghi chú của riêng từng người
                 contextSentence            ← câu gốc trong chat
                 dữ liệu SM-2               ← lịch ôn tập cá nhân
```

**Vì sao không để nghĩa chung trong `WordLibrary`:** nhiều người dùng chung một dòng, nên nếu A sửa nghĩa thì sổ từ của B cũng đổi theo. Tách ra là cách duy nhất để mỗi người có sổ từ riêng mà DB vẫn không lưu trùng.

### 1.3. Cần gỡ bỏ

| Thành phần | Xử lý |
|---|---|
| `WordLibrary.isPublic` · `updatedById` · `definition` · `example` | Gỡ |
| `WordLibrary.saveCount` | Giữ (biết từ nào phổ biến), nhưng không dùng để công khai |
| `GET /vocabulary/library` · `PATCH /vocabulary/library/:id` | Gỡ endpoint + trang UI |
| `ActivityPostType.word_public` | Gỡ khỏi luồng sinh post |
| **BR-12** | **Xoá khỏi AGENTS.md** |

---

## 2. Bài test trắc nghiệm theo CEFR ⭐ *(ưu tiên cao nhất)*

### 2.1. Quyết định

- Trắc nghiệm **20 câu**, dùng **ngân hàng câu hỏi soạn sẵn theo khung CEFR**.
- Giới hạn **3 bài/ngày**.
- Thiết kế khung trình độ: do BA đề xuất (mục 2.3).

### 2.2. Điểm khó thật sự: nội dung, không phải code

Phần code của tính năng này khá đơn giản. **Toàn bộ khó khăn nằm ở việc soạn câu hỏi.**

Tính thử khối lượng cần có:

| | Số lượng |
|---|---|
| 1 bài | 20 câu |
| 3 bài/ngày | 60 câu — nếu kho chỉ có 60 câu thì hết ngày đầu người dùng đã thấy hết |
| Kho tối thiểu cho 1 (ngôn ngữ × trình độ) | **~60 câu** (đủ 3 bài không lặp trong ngày) |
| Kho dễ chịu | ~100 câu |

Nhân lên: 2 ngôn ngữ × 4 trình độ × 60 câu = **480 câu**. Nếu làm cả 8 ngôn ngữ đã seed × 6 trình độ = **~2.900 câu**. Đây là công **soạn nội dung**, không phải công lập trình — dev không giải quyết được bằng cách code nhanh hơn.

**Đề xuất giải quyết: sinh bằng AI rồi người rà soát.** Team đã dùng Claude Code và Antigravity, tận dụng đúng vào việc này:

```
1. BA viết prompt mẫu chuẩn (kèm tiêu chí CEFR từng level, format JSON cố định)
2. AI sinh từng lô 20–30 câu cho một (ngôn ngữ, level)
3. Người biết ngôn ngữ đó rà soát: đáp án đúng chưa, đáp án nhiễu có hợp lý không,
   độ khó có đúng level không → loại/sửa câu hỏng
4. Câu đạt → đưa vào seed file, đánh dấu `status = published`
```

**Phạm vi khả thi trong 3,5 tuần:** bắt đầu với **2 ngôn ngữ (en, vi) × 4 level (A1→B2) × 60 câu = 480 câu**. Ngôn ngữ và level còn lại bổ sung dần — hệ thống thiết kế để thêm câu hỏi không cần sửa code.

**Bẫy cần tránh:** chất lượng **đáp án nhiễu (distractor)** quyết định bài test có ý nghĩa hay không. Nếu 1 đáp án là động từ còn 3 đáp án kia là danh từ, người làm đoán trúng mà không cần biết nghĩa. Đây là tiêu chí rà soát quan trọng nhất, và cũng là chỗ AI hay làm ẩu.

### 2.3. Thiết kế khung trình độ (đa framework)

`Language.framework` đã có sẵn với 4 giá trị `CEFR | HSK | JLPT | TOPIK`, hiện seed toàn bộ 8 ngôn ngữ là `CEFR`.

**Đề xuất: lưu thêm `levelOrder` dạng số để so sánh và lên trình độ được thống nhất giữa các framework.**

| Framework | Các bậc | levelOrder |
|---|---|---|
| CEFR | A1 · A2 · B1 · B2 · C1 · C2 | 1 → 6 |
| HSK | 1 → 6 | 1 → 6 |
| JLPT | N5 · N4 · N3 · N2 · N1 | 1 → 5 |
| TOPIK | 1 → 6 | 1 → 6 |

Nhờ `levelOrder`, logic "lên một bậc" viết một lần dùng cho mọi framework, không phải if/else theo từng loại.

**Xử lý chênh lệch với dữ liệu người dùng hiện có:** `UserLanguage.level` đang là chuỗi tự do — *learning* dùng thang 1–5, *fluent* dùng CEFR. Quy đổi để bài test biết bắt đầu từ đâu:

| `UserLanguage.level` (learning) | Bắt đầu ở CEFR |
|---|---|
| 1 | A1 |
| 2 | A2 |
| 3 | B1 |
| 4 | B2 |
| 5 | C1 |
| chưa khai | A1 (hoặc cho chọn tay) |

### 2.4. Cơ chế "cập nhật dần theo trình độ"

Bài test vừa là **luyện tập**, vừa là **xếp lớp**:

```
Điểm ≥ 80%  → gợi ý lên bậc kế tiếp, cập nhật UserLanguage.level
Điểm 50–79% → giữ nguyên bậc, tiếp tục luyện
Điểm < 50%  → gợi ý lùi một bậc
```

Chỉ **gợi ý**, người dùng bấm xác nhận — không tự động đổi trình độ trong hồ sơ của họ.

**Ưu tiên câu chưa gặp:** lưu lịch sử câu đã làm, khi sinh đề thì ưu tiên câu chưa gặp trước. Hết câu mới thì mới lặp lại câu cũ.

### 2.5. Loại câu hỏi

Cả 4 loại đều dạng trắc nghiệm 4 đáp án, cùng cấu trúc dữ liệu:

| Loại | Ví dụ | Level phù hợp |
|---|---|---|
| `vocabulary` | "*Apply* nghĩa là gì?" | A1–B1 |
| `grammar` | "She ___ to school every day." | A1–B2 |
| `cloze` | Điền từ vào chỗ trống trong đoạn văn ngắn | B1–C2 |
| `reading` | Đọc đoạn 3–4 câu rồi trả lời | B2–C2 |

### 2.6. Dữ liệu mới

```prisma
model TestQuestion {
  id          Int          @id @default(autoincrement())
  languageId  Int          @map("language_id")
  framework   String       // CEFR | HSK | JLPT | TOPIK
  level       String       // A1, B2, N3, ...
  levelOrder  Int          @map("level_order")   // 1..6 — để so sánh/lên bậc
  type        QuestionType // vocabulary | grammar | cloze | reading
  passage     String?      // đoạn văn cho reading/cloze
  prompt      String       // câu hỏi
  options     String[]     // đúng 4 đáp án
  answerIndex Int          @map("answer_index")  // 0..3
  explanation String?      // giải thích, hiện khi xem lại câu sai
  status      QuestionStatus @default(draft)     // draft | published | rejected
  createdAt   DateTime     @default(now()) @map("created_at")

  language Language @relation(fields: [languageId], references: [id])

  @@index([languageId, levelOrder, status])
  @@map("test_questions")
}

model TestAttempt {
  id          Int       @id @default(autoincrement())
  userId      Int       @map("user_id")
  languageId  Int       @map("language_id")
  level       String
  levelOrder  Int       @map("level_order")
  totalCount  Int       @default(20) @map("total_count")
  correctCount Int      @default(0)  @map("correct_count")
  startedAt   DateTime  @default(now()) @map("started_at")
  finishedAt  DateTime? @map("finished_at")

  answers TestAnswer[]

  @@index([userId, startedAt])
  @@map("test_attempts")
}

model TestAnswer {
  id           Int     @id @default(autoincrement())
  attemptId    Int     @map("attempt_id")
  questionId   Int     @map("question_id")
  chosenIndex  Int?    @map("chosen_index")   // null = bỏ qua
  isCorrect    Boolean @map("is_correct")

  attempt TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@index([questionId])
  @@map("test_answers")
}

enum QuestionType   { vocabulary  grammar  cloze  reading }
enum QuestionStatus { draft  published  rejected }
```

`TestAnswer` phục vụ hai việc: xem lại câu sai, và lọc câu đã gặp khi sinh đề lần sau.

### 2.7. Business rules đề xuất

| Mã | Quy tắc |
|---|---|
| BR-16 | Tối đa **3 bài test/ngày/ngôn ngữ**; mốc reset theo timezone của người dùng |
| BR-17 | Kết quả chỉ dùng để gợi ý cập nhật trình độ cá nhân — **không xếp hạng, không so sánh giữa người dùng** (giữ nguyên tắc no-credit, BR-13) |
| BR-18 | Chỉ lấy câu `status = published` vào đề thi |
| BR-19 | Bài đang làm dở quá 24h không hoàn thành → tự huỷ, **vẫn tính** vào hạn mức ngày (chống lách luật bằng cách bỏ dở) |

### 2.8. Còn phải chốt

1. Kho câu hỏi bắt đầu với ngôn ngữ nào? (Đề xuất: `en` + `vi`, vì đây là 2 ngôn ngữ chắc chắn có người rà soát được.)
2. Ai rà soát câu hỏi AI sinh ra cho từng ngôn ngữ?
3. Có cần trang Admin để duyệt/sửa câu hỏi không, hay chỉ nạp qua seed file? (Seed file rẻ hơn nhiều cho MVP.)
4. Người dùng làm bài ở ngôn ngữ mình đang học, hay cho phép làm mọi ngôn ngữ?

---

## 3. Audio call ⭐ *(ưu tiên 2)*

### 3.1. Quyết định

| Nội dung | Chốt |
|---|---|
| Phạm vi | **Audio-only**, chưa làm video |
| TURN server | Phải **miễn phí** |
| Thời lượng tối đa | **30 phút/cuộc** |
| Tính vào giờ chat (BR-14) | **Có** |
| Mức hoàn thiện | **Dùng được thật giữa 2 người ở 2 mạng khác nhau** (không phải PoC 2 tab) |

### 3.2. Tin tốt: yêu cầu "free" và "dùng thật" không mâu thuẫn

Trước đây em cảnh báo TURN là rủi ro chi phí. Với **audio-only** thì con số hoàn toàn khác:

- Audio WebRTC (codec Opus) tốn khoảng **40 kbps**
- Cuộc gọi 30 phút ≈ **9 MB** một chiều → TURN trung chuyển 2 chiều ≈ **18 MB/cuộc**
- [Open Relay của Metered](https://www.metered.ca/tools/openrelay/) cho **20 GB/tháng miễn phí** → khoảng **1.100 cuộc gọi 30 phút mỗi tháng**
- Thực tế còn dư nhiều hơn: **TURN chỉ được dùng khi kết nối trực tiếp thất bại** (thường 10–20% số cuộc gọi), phần lớn đi thẳng P2P không tốn quota

Kết luận: **hạn mức miễn phí thừa sức cho một đồ án.** Nếu làm video thì câu chuyện đã khác hẳn — thêm một lý do nữa để audio-only là lựa chọn đúng.

Ngoài Open Relay còn có [ExpressTURN](https://www.expressturn.com/) và Xirsys free tier làm phương án dự phòng. Nên cấu hình **nhiều ICE server** để một cái hỏng vẫn còn cái khác.

### 3.3. Thành phần kỹ thuật

| Thành phần | Cách làm |
|---|---|
| Signaling (trao đổi SDP + ICE candidate) | ✅ Dùng lại **Socket.IO đã có** — thêm event, không dựng server mới |
| STUN | Server công cộng Google (`stun:stun.l.google.com:19302`) — miễn phí |
| TURN | Open Relay (đăng ký lấy credential, để trong `.env`, **không commit**) |
| UI cuộc gọi | Nút gọi trong màn chat · màn hình chuông đến · tắt mic · hiện thời lượng · kết thúc |
| Quyền micro | Xin quyền, xử lý khi user từ chối (hiện hướng dẫn bật lại) |

**Các socket event cần có:** `call:invite` · `call:accept` · `call:reject` · `call:ice-candidate` · `call:end` · `call:timeout`.

### 3.4. Ràng buộc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-20 | Chỉ gọi được người đã có `Conversation` chung (đã match) |
| BR-21 | Block 2 chiều (BR-09) → không gọi được, không nhận được cuộc gọi |
| BR-22 | **Không ghi âm cuộc gọi** — riêng tư, pháp lý, dung lượng |
| BR-23 | Tối đa **30 phút/cuộc**; còn 2 phút thì cảnh báo, hết giờ tự ngắt (gọi lại được ngay) |
| BR-24 | Thời lượng cuộc gọi **cộng vào tổng giờ chat** của BR-14 |
| BR-25 | Cuộc gọi nhỡ/từ chối sinh một tin nhắn hệ thống trong hội thoại |

**Bổ sung cho gọi video** ([`video-call-upgrade.md`](../02-design/video-call-upgrade.md)) — đánh số tiếp sau BR-32 vì BR-26 → BR-32 đã dùng cho Community và Trò chơi:

| Mã | Quy tắc |
|---|---|
| BR-33 | Loại cuộc gọi (`audio`/`video`) chọn khi bắt đầu, **không đổi giữa cuộc** |
| BR-34 | Video giới hạn **640×480 @ 24fps, tối đa 500 kbps** — bảo vệ hạn mức TURN 20 GB/tháng |
| BR-35 | Tắt camera dùng `track.enabled`, phải báo phía kia qua `call:media-state` |
| BR-36 | **Không ghi hình cuộc gọi** — mở rộng BR-22 (không ghi âm) |
| BR-37 | Người nhận cuộc gọi video được **trả lời ở chế độ audio** (nghe + thấy đối phương, không bật camera mình) |

**Lưu ý về BR-24:** BR-14 hiện tính giờ chat bằng khoảng cách giữa các tin nhắn và **tính lại khi đọc, không cache**. Thời lượng cuộc gọi thì ngược lại — phải **lưu lại** vì không suy ra được từ tin nhắn. Cần bảng `CallSession`:

```prisma
model CallSession {
  id             Int       @id @default(autoincrement())
  conversationId Int       @map("conversation_id")
  callerId       Int       @map("caller_id")
  calleeId       Int       @map("callee_id")
  startedAt      DateTime  @map("started_at")
  endedAt        DateTime? @map("ended_at")
  durationSec    Int       @default(0) @map("duration_sec")
  endReason      String?   @map("end_reason")  // hangup | timeout | rejected | missed | failed
  createdAt      DateTime  @default(now()) @map("created_at")

  @@index([conversationId, startedAt])
  @@map("call_sessions")
}
```

Tổng giờ chat = (giờ tính từ tin nhắn theo BR-14) + (tổng `durationSec` các cuộc gọi thành công). **Cần cập nhật BR-14 trong AGENTS.md** cho khớp.

### 3.5. Rủi ro cần lưu ý khi test

Đây là nơi tính năng hay "chạy trên máy em, hỏng lúc demo":

- Phải test **2 máy ở 2 mạng khác nhau** (vd 1 máy wifi nhà, 1 máy 4G) — test 2 tab cùng máy **không chứng minh được gì**
- Trình duyệt chặn micro nếu trang không chạy **HTTPS** (localhost được miễn) → khi deploy phải có HTTPS
- Test cả trường hợp: từ chối quyền micro, đang gọi thì mất mạng, đối phương không bắt máy

### 3.6. Còn phải chốt

1. Ai đăng ký tài khoản Open Relay và giữ credential?
2. Có cho gọi khi đối phương đang offline không (hiện "máy bận"/"không trả lời")?
3. Cuộc gọi nhỡ có gửi notification không?

---

## 4. Community mở — dịch theo hướng tiết kiệm tối đa

### 4.1. Quyết định

- Feed **không chia theo ngôn ngữ**; ai cũng đăng và trao đổi thoải mái.
- Có dịch + tự động xác định ngôn ngữ nguồn.
- **Ưu tiên: tiết kiệm chi phí API tối đa.**

### 4.2. Bốn tầng tiết kiệm

Xếp theo mức tiết kiệm được, nhiều nhất trước:

**① Cache theo (bài đăng × ngôn ngữ đích) — tiết kiệm lớn nhất**

Hệ thống chỉ có 2 ngôn ngữ giao diện (`vi`, `en`). Nghĩa là **mỗi bài đăng chỉ cần dịch đúng một lần trong suốt vòng đời** — bài viết bằng tiếng Việt chỉ cần một bản tiếng Anh, dùng chung cho mọi người xem.

> **Tổng số lần gọi API ≈ số bài đăng, không phụ thuộc số lượt xem.** Một bài viral 10.000 lượt xem vẫn chỉ tốn 1 lần gọi.

**② Xác định ngôn ngữ nguồn ở client — miễn phí hoàn toàn**

Không dùng API `detect` của Google (tốn tiền như dịch). Dùng thư viện nhận diện ngôn ngữ chạy ngay trên trình duyệt (`tinyld`, `franc`...) — miễn phí, không cần mạng. Độ chính xác đủ dùng với đoạn văn vài câu.

Lưu kết quả vào `ActivityPost.sourceLanguage` lúc đăng, dùng lại mãi về sau.

**③ Dịch theo yêu cầu, không dịch sẵn**

Hiển thị nguyên văn + nút "Xem bản dịch". Chỉ gọi API khi người dùng thật sự bấm.

Nút chỉ hiện khi `sourceLanguage ≠ ngôn ngữ giao diện của người xem` — người Việt xem bài tiếng Việt thì không thấy nút, không tốn gì.

Lý do sản phẩm: người **đang học ngoại ngữ** thường muốn thử đọc bản gốc trước rồi mới đối chiếu bản dịch. Dịch sẵn làm mất cơ hội học.

**④ Giới hạn độ dài bài đăng**

Google Translate tính tiền **theo ký tự**. Giới hạn bài đăng **1.000 ký tự** vừa chặn trần chi phí mỗi lần gọi, vừa giữ feed dễ đọc.

### 4.3. Luồng

```
Lúc đăng:   nhận diện ngôn ngữ ở client (miễn phí) → lưu post.sourceLanguage
Lúc xem:    hiện nguyên văn; nếu khác ngôn ngữ giao diện → hiện nút "Xem bản dịch"
Khi bấm:    tra cache (postId, targetLang)
              có   → trả ngay, KHÔNG gọi API
              chưa → gọi Google Translate → lưu cache → trả về
Lỗi/quota:  hiện "chưa dịch được, thử lại sau", vẫn xem được bài gốc
```

### 4.4. Chống feed trống: bài đăng có khung sẵn

Với cộng đồng mới, feed trống nguy hiểm hơn không có feed — và textarea trắng là thứ khó điền nhất. Cho chọn loại bài, mỗi loại có khung gợi ý:

| Loại bài | Khung nội dung | Nguồn |
|---|---|---|
| 📖 Chia sẻ từ mới học | Chọn 1 từ trong sổ + 1 câu về hoàn cảnh học được | `UserSavedWord` |
| ❓ Hỏi người bản xứ | Câu hỏi về cách dùng / phân biệt hai từ | Người dùng nhập |
| 😅 Lỗi sai buồn cười | Kể một lần dùng sai và chuyện gì xảy ra | Người dùng nhập |
| 🏆 Cột mốc | Tự động | `chat_hours_milestone` (đã có) |
| 🎮 Kết quả trò chơi | Tự động | Mục 5 |
| ✍️ Tự do | Textarea trắng | Giữ, **không** để mặc định |

Khung còn giúp nội dung có cấu trúc → dịch chính xác hơn, feed đỡ hỗn tạp.

### 4.5. Dữ liệu mới

```prisma
model PostTranslation {
  id             Int      @id @default(autoincrement())
  postId         Int      @map("post_id")
  targetLanguage String   @map("target_language")
  translatedText String   @map("translated_text")
  createdAt      DateTime @default(now()) @map("created_at")

  @@unique([postId, targetLanguage])
  @@map("post_translations")
}
```

Thêm vào `ActivityPost`: `sourceLanguage String?` · `postKind String?` (loại bài ở mục 4.4).

### 4.6. Business rules đề xuất

| Mã | Quy tắc |
|---|---|
| BR-26 | Bài đăng Community tối đa **1.000 ký tự** |
| BR-27 | Bản dịch **cache theo (bài × ngôn ngữ đích)**, không gọi lại API cho bài đã dịch |
| BR-28 | Ngôn ngữ nguồn nhận diện **ở client**, không gọi API detect |
| BR-29 | Dịch **chỉ khi người dùng yêu cầu**, không dịch tự động khi render feed |

### 4.7. Thay đổi quy ước i18n đã chốt

Quy ước i18n hiện ghi *"không dịch nội dung do user tạo"*. Quyết định này thay đổi ranh giới đó:

- ✅ **Được dịch:** bài đăng Community (theo yêu cầu)
- ❌ **Vẫn không dịch:** tin nhắn chat 1:1, bio, từ trong sổ từ vựng

Giữ nguyên vế "không dịch chat 1:1" là có lý do sản phẩm: chat là nơi *luyện tập*, dịch sẵn ở đó triệt tiêu việc học.

### 4.8. Còn phải chốt

1. Bình luận có dịch không? (Đề xuất: **chưa** ở giai đoạn đầu — bình luận nhiều và ngắn, cache kém hiệu quả hơn bài đăng.)
2. Có giới hạn số lần bấm dịch/ngày mỗi người không? (Nếu đã cache theo bài thì gần như không cần.)
3. Bài đăng tự do kiểm duyệt trước hay đăng ngay rồi report sau? (Đề xuất: **đăng ngay** — đã có Report/Block/Moderation.)

---

## 5. Trò chơi hai người — "Đoán từ"

### 5.1. Quyết định

- Chơi **ngay trong màn chat hiện có**, không mở màn riêng.
- Trạng thái ván chơi **chỉ tồn tại trong phiên, tự xoá sau 1 giờ**.
- Một người bỏ giữa chừng hoặc mất mạng → **dừng ván**, không lưu dở.

### 5.2. Luật chơi

```
1. A chọn 1 từ trong sổ từ (ngôn ngữ A đang học) → hệ thống ẩn từ khỏi màn hình B
2. A mô tả từ đó bằng ngôn ngữ đích, KHÔNG được viết ra từ đó
   → hệ thống chặn nếu A gõ trúng từ
3. B đoán bằng tin nhắn thường trong chat
4. Hệ thống so khớp → đúng thì cả hai cùng "hoàn thành"
   → từ đó được đánh dấu đã dùng lại trong sổ của A
5. Đổi vai. 5 lượt là hết một ván
```

**Nguyên tắc: hợp tác, không thi đấu.** Kết quả là "cả hai cùng hoàn thành", không phải "ai hơn ai" — nhờ vậy có tính chơi mà không cần bảng xếp hạng, giữ đúng nguyên tắc no-credit (BR-13).

**Vì sao chọn trò này:** nó luyện đúng kỹ năng khó nhất khi nói ngoại ngữ — *diễn đạt vòng khi thiếu từ*. Flashcard không dạy được kỹ năng đó. Và nó chạy hoàn toàn trên chat text sẵn có, không cần engine game mới.

### 5.3. Trạng thái tạm — thiết kế theo quyết định "xoá sau 1 giờ"

Ván chơi là dữ liệu **tạm**, không phải lịch sử cần giữ:

| Cái gì | Lưu ở đâu | Vòng đời |
|---|---|---|
| Trạng thái ván (từ bí mật, lượt, điểm) | Bảng `GameSession` | **Tự xoá sau 1 giờ** |
| Tin nhắn mô tả / đoán | Tin nhắn chat bình thường | Giữ như mọi tin nhắn |
| Từ được đánh dấu "đã dùng lại" | `UserSavedWord` | Giữ vĩnh viễn |

```prisma
model GameSession {
  id             Int      @id @default(autoincrement())
  conversationId Int      @map("conversation_id")
  hostId         Int      @map("host_id")
  guestId        Int      @map("guest_id")
  secretWordId   Int?     @map("secret_word_id")   // UserSavedWord đang được đoán
  round          Int      @default(1)
  status         String   // waiting | playing | finished | aborted
  expiresAt      DateTime @map("expires_at")       // = createdAt + 1 giờ
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([conversationId, status])
  @@index([expiresAt])
  @@map("game_sessions")
}
```

**Dọn dẹp:** một cron job chạy mỗi 15 phút xoá bản ghi `expiresAt < now()`. Không cần Redis.

**Bỏ giữa chừng / mất mạng:** socket ngắt kết nối quá 60 giây → đặt `status = aborted`, báo trong chat *"Ván chơi đã dừng"*. Không lưu điểm dở dang.

### 5.4. Nối với Community

Ván hoàn thành sinh một `ActivityPost` tự động: *"Vinh và Maria vừa hoàn thành 5 từ trong Đoán từ"* — vừa tạo nội dung cho feed, vừa giúp trò chơi lan toả.

### 5.5. Business rules đề xuất

| Mã | Quy tắc |
|---|---|
| BR-30 | Trạng thái ván chơi tự xoá sau **1 giờ**; không lưu lịch sử ván |
| BR-31 | Mất kết nối quá 60 giây → ván chuyển `aborted`, không tính kết quả |
| BR-32 | Không có điểm tích luỹ hay xếp hạng giữa người dùng (no-credit) |

---

## 6. Chứng chỉ trong profile

### 6.1. Quyết định

Người dùng **tự khai** dạng ghi chú, **không cần ảnh chứng minh**, không cần admin duyệt. Mục đích: làm profile đầy đặn hơn.

### 6.2. Thiết kế

Thêm vào `User`:

```prisma
certificates String[] @default([])   // tối đa 5 mục, mỗi mục ≤ 50 ký tự
```

- Hiển thị dạng chip dưới phần ngôn ngữ: `JLPT N2` · `IELTS 7.0` · `HSK 4`
- Kèm nhãn nhỏ **"tự khai, chưa xác minh"** — minh bạch, tránh hiểu lầm
- Nằm trong phạm vi Report/Moderation như mọi nội dung do user tạo

**Lưu ý sản phẩm:** chứng chỉ chỉ nói lên vế *người học*. Người bản xứ không có chứng chỉ tiếng mẹ đẻ — nên đừng thiết kế UI kiểu "profile không có chứng chỉ thì trông thiếu", vì như vậy làm một nửa số người dùng thấy hồ sơ mình kém.

---

## 7. Tác động tới tài liệu — phải cập nhật

| Tài liệu | Thay đổi |
|---|---|
| `AGENTS.md` mục 7 | Gỡ khỏi "không làm": quiz/gamification, đăng bài tự do Community, dịch nội dung user, media call, chứng chỉ |
| `AGENTS.md` — **BR-08** | Sửa: chat text + **audio call**; vẫn chưa có video/ảnh |
| `AGENTS.md` — **BR-12** | **Xoá** (bỏ thư viện từ công khai) |
| `AGENTS.md` — **BR-14** | Sửa: tổng giờ chat = giờ từ tin nhắn **+ thời lượng audio call** (`CallSession`) |
| `AGENTS.md` mục 3 | Thêm **BR-16 → BR-32** đề xuất trong tài liệu này |
| `AGENTS.md` mục 4 (i18n) | Sửa ranh giới dịch (mục 4.7) |
| `AGENTS.md` mục 6 | Cập nhật bản đồ module: bỏ FS-24, thêm tính năng mới |
| SRS — FS-24 | Viết lại hoặc bỏ |
| `ERD.mermaid` / `ERD.png` | Thêm `TestQuestion`, `TestAttempt`, `TestAnswer`, `CallSession`, `GameSession`, `PostTranslation`; thêm `User.certificates`, `ActivityPost.sourceLanguage/postKind`; gỡ phần thư viện công khai |
| Product Backlog | Thêm US mới, gỡ US của FS-24 |

## 8. Câu hỏi còn lại

**Chặn cứng:**

1. Kho câu hỏi bắt đầu với ngôn ngữ nào, **ai rà soát** câu do AI sinh? (mục 2.8) — đây là đường găng của tính năng ưu tiên số 1
2. Ai đăng ký và giữ credential TURN (Open Relay)? (mục 3.6)

**Cần sớm:**

3. Có làm trang Admin duyệt câu hỏi không, hay chỉ nạp qua seed file? (mục 2.8)
4. `VocabWord` có phải code chết không — xoá được chưa? (mục 0)
5. Bình luận Community có dịch không? (mục 4.8)

## 9. Quyết định đã bỏ — ghi lại để không bàn lại

**Người bản xứ xác nhận / góp ý từ** — đề xuất ngày 26/07, **bỏ cùng ngày**.

Ghi lại để biết cái gì đã mất: đây vốn là ý tưởng tạo khác biệt rõ nhất so với Google Translate ("người bản xứ thật nói rằng người ta ít dùng từ đó"). Sau khi bỏ, sổ từ vựng quay về mô hình cá nhân — giá trị khác biệt chuyển sang **audio call** và **trò chơi 2 người**, là hai chỗ tương tác người-với-người còn lại. Nếu sau này cần tăng tính kết nối cho sổ từ vựng, đây là ý tưởng đáng lấy ra xem lại.

## 10. Tài liệu liên quan

- [`AGENTS.md`](../../AGENTS.md) — business rules, phạm vi
- [`phan-tich-scope-tuan-27-07-2026.md`](../03-planning/phan-tich-scope-tuan-27-07-2026.md) — phân tích khối lượng & rủi ro
- [`api-contract-convention.md`](../04-convention/api-contract-convention.md) — quy ước API cho endpoint mới
- [`product-backlog-user-stories.md`](product-backlog-user-stories.md) — backlog hiện tại
