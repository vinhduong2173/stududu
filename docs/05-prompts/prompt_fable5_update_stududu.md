# Prompt cho Fable 5 — Code đợt cập nhật Stududu (SRS v3.0, 08/07/2026)

## Bối cảnh
Dự án Stududu — web trao đổi ngôn ngữ (Tandem model). Stack: **Next.js** (FE) + **NestJS** (BE) + **Socket.IO** (realtime chat) + **PostgreSQL**. Codebase hiện tại đã implement xong 22 user story gốc (US-01→US-22, module Account/Auth, Language Profile, Discovery & Matching, 1:1 Text Chat, Trust, Admin/Moderation).

Đây là đợt bổ sung theo SRS v3.0 (xem file `SRS-stududu_FULL.docx`, PHẦN 3.4/3.5/3.6/3.8/3.9/3.10 và PHẦN 4.3): sửa 2 FS cũ + thêm 6 user story mới (US-23→US-28). **Giữ nguyên kiến trúc, coding convention, cấu trúc thư mục hiện có của repo** — không refactor lại phần cũ trừ khi bắt buộc để tích hợp tính năng mới.

Làm theo đúng thứ tự ưu tiên dưới đây (Must trước, Should sau), mỗi mục làm xong thì chạy test/build trước khi qua mục kế tiếp.

---

## 1. [Must] Sửa FS-08 — Matching luôn trả về 6–10 gợi ý

**Thay đổi thuật toán ở service tính gợi ý matching hiện có:**
- Query cặp bù trừ như cũ (learning A ↔ native/fluent B và ngược lại), tính `MATCH_SCORE = lang_complement + shared_topic_count + intent_alignment`.
- Nếu kết quả < 6, nới dần theo đúng thứ tự: (1) bỏ lọc topic chung → (2) nới khoảng level mong muốn → (3) bỏ ưu tiên sắp xếp theo `last_active`. Dừng nới ngay khi đủ 6 hoặc hết ứng viên bù trừ hợp lệ.
- Giới hạn trả về tối đa 10 người/lần gọi API (pagination cho "xem thêm").
- Điều kiện bù trừ (learning↔native|fluent) **không được nới** — đây là điều kiện ghép chính, bất biến.
- Nếu sau khi nới hết vẫn <6 (do pool user nhỏ) → trả về số lượng có được kèm flag `insufficient_pool: true` để FE hiển thị thông báo "chưa đủ đối tác phù hợp, quay lại sau" thay vì empty state.
- Viết unit test cho 3 trường hợp: đủ ≥10 ngay từ đầu, phải nới 1-2 bậc mới đủ 6, pool quá nhỏ không đủ 6.

## 2. [Must] Sửa FS-14 — Chat: reaction + click-to-save từ vựng

- Thêm reaction emoji trên MESSAGE: tập emoji cố định (định nghĩa trong config, không cho custom), lưu dạng bảng phụ hoặc JSON column trên MESSAGE (tự quyết theo pattern ORM hiện có).
- FE: cho phép bôi đen/chọn 1 từ trong nội dung tin nhắn → hiện icon "Lưu từ vựng" → gọi API tạo `USER_SAVED_WORD` (xem mục 3). Không tạo bảng riêng cho ngữ cảnh chat — dùng chung entity với FS-23.
- Không làm ảnh/voice/video ở đợt này (giữ nguyên text-only + reaction).

## 3. [Must] FS-23 — Lưu từ yêu thích (Vocabulary, lõi)

**Entity mới `WORD_LIBRARY`:**
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | PK | ✔ | |
| term | varchar | ✔ | ≤100 ký tự |
| language_id | FK LANGUAGE | ✔ | |
| definition | text | — | có thể null, chờ bổ sung |
| example | text | — | |
| save_count | int | ✔ | default 0 |
| is_public | boolean | ✔ | default false |
| created_at | datetime | ✔ | |

**Entity mới `USER_SAVED_WORD`** (junction Member ↔ WORD_LIBRARY):
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | PK | ✔ | |
| user_id | FK USER | ✔ | |
| word_library_id | FK WORD_LIBRARY | ✔ | |
| personal_note | text | — | nghĩa/ví dụ riêng của user |
| source | enum('chat','manual') | ✔ | |
| created_at | datetime | ✔ | |

Ràng buộc: `UNIQUE(user_id, word_library_id)`.

**API cần có:**
- `POST /vocabulary/save-word` — body: `{ term, language_id, personal_note?, source }`. Logic: tìm/tạo `WORD_LIBRARY` theo `(term, language_id)`, tạo `USER_SAVED_WORD` nếu chưa tồn tại (nếu đã có → chỉ update `created_at`/last-accessed, không tạo bản ghi trùng), tăng `save_count` của `WORD_LIBRARY` khi có `USER_SAVED_WORD` mới (không tăng khi trùng).
- `GET /vocabulary/my-words` — danh sách từ đã lưu của user, sort theo gần nhất.

FE: trang "Từ đã lưu" trong hồ sơ Member.

## 4. [Must] FS-26 — Endorsement định tính (Trust, lõi)

**Entity mới `ENDORSEMENT`:**
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | PK | ✔ | |
| giver_id | FK USER | ✔ | |
| receiver_id | FK USER | ✔ | |
| label | enum | ✔ | `lang_proficiency`, `social_knowledge`, `niche_expertise`, `friendliness` |
| created_at | datetime | ✔ | |

Ràng buộc: `UNIQUE(giver_id, receiver_id, label)` (không cộng dồn trùng lặp).

**API:**
- `POST /trust/endorse` — body `{ receiver_id, labels: string[] }`, validate `receiver_id` đã có ≥1 CONVERSATION với `giver_id` (dùng lại query check của module Chat).
- `GET /users/:id/endorsements` — trả về đếm số lượt theo từng nhãn, ví dụ `{ friendliness: 5, social_knowledge: 2 }`.

**Quan trọng:** KHÔNG implement điểm trung bình / rating tổng hợp / xếp hạng số — chỉ đếm số lượt theo nhãn. Đây là nguyên tắc no-credit cốt lõi của sản phẩm, đừng tự ý thêm field `average_rating` hay tương tự.

FE: hiển thị badge dạng "Nhãn · số lượt" trên hồ sơ, nút "Ghi nhận" ở trang hồ sơ/hội thoại đối tác.

## 5. [Must] FS-27 — Thống kê giờ chat & hội thoại (Trust, lõi)

Không tạo bảng mới — tính từ dữ liệu MESSAGE/CONVERSATION đã có, tính lại khi đọc (không cache, giống triết lý MATCH_SCORE).

**Logic tính "giờ chat":**
- Với mỗi CONVERSATION, nhóm MESSAGE theo phiên: một phiên kết thúc khi khoảng cách giữa 2 tin liên tiếp > 30 phút (tái dùng đúng ngưỡng idle timeout đã có ở FS-03/session).
- Thời lượng phiên = timestamp(tin cuối) - timestamp(tin đầu) trong phiên đó.
- Tổng giờ chat = tổng thời lượng mọi phiên trên mọi CONVERSATION của user, trừ các CONVERSATION đã bị block 2 chiều.

**API:** `GET /users/:id/chat-stats` → `{ total_chat_hours: number, conversation_count: number }`.

FE: hiển thị trên hồ sơ cạnh Endorsement badges.

## 6. [Should] FS-24 — Thư viện từ vựng chung

- Thêm cron/trigger: mỗi lần `save_count` của `WORD_LIBRARY` tăng, kiểm tra nếu `save_count >= 3` (ngưỡng cấu hình được, đặt hằng số `WORD_LIBRARY_PUBLIC_THRESHOLD = 3`) thì set `is_public = true`.
- `GET /vocabulary/library` — public endpoint (không cần auth), trả về danh sách `WORD_LIBRARY` có `is_public = true`, sort theo `save_count` DESC, hỗ trợ search theo `term`.
- Nếu `definition` null, FE hiển thị trạng thái "Cần bổ sung định nghĩa"; cho phép Member bất kỳ bổ sung qua `PATCH /vocabulary/library/:id` (ghi log ai sửa để Admin có thể revert nếu spam — dùng lại cơ chế Report/Moderation hiện có, `target_type = 'word_library'`).

## 7. [Should] FS-25 — Community feed (auto-activity, chưa làm free-form post)

**Entity mới `ACTIVITY_POST`:**
| Field | Kiểu | Bắt buộc |
|---|---|---|
| id | PK | ✔ |
| user_id | FK USER | ✔ |
| type | enum('word_public','chat_hours_milestone') | ✔ |
| content_ref | varchar (nullable) | — |
| created_at | datetime | ✔ |

**Entity mới `POST_LIKE`:** `id, post_id (FK), user_id (FK), created_at`, `UNIQUE(post_id, user_id)`.

- Trigger tạo `ACTIVITY_POST` tự động: khi một `WORD_LIBRARY` chuyển `is_public = true` do chính user đó vừa lưu (event từ mục 6), hoặc khi `total_chat_hours` của user vượt mốc cấu hình (VD: mỗi 10 giờ).
- **Không làm form đăng bài tự do (free-form) ở đợt này** — chỉ auto-generated post.
- `GET /community/feed` — public feed, sort mới nhất.
- `POST /community/posts/:id/like` / unlike.
- User có thể tắt tính năng này trong Settings (`user.share_activity = false` → không tạo post).
- Report một post: tái dùng API Report hiện có với `target_type = 'post'`.

## 8. [Should] FS-28 — Đặt lịch hẹn trong hội thoại

**Entity mới `SCHEDULE_REQUEST`:**
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | PK | ✔ | |
| conversation_id | FK CONVERSATION | ✔ | |
| proposer_id | FK USER | ✔ | |
| proposed_time_utc | datetime | ✔ | lưu UTC |
| status | enum('pending','accepted','declined','expired') | ✔ | |
| created_at | datetime | ✔ | |

- `POST /schedule` (trong context 1 conversation) — validate `proposed_time_utc` không ở quá khứ.
- `PATCH /schedule/:id/respond` — `{ action: 'accept' | 'decline' }`.
- Cron job: tự chuyển `expired` nếu quá 48h không phản hồi.
- FE hiển thị thời gian theo timezone trình duyệt của từng người (convert client-side từ UTC).
- Nhắc lịch: in-app notification trước giờ hẹn 30 phút (dùng lại hạ tầng notification hiện có, nếu chưa có thì làm notification đơn giản qua Socket.IO). **Chưa làm** export `.ics` / đồng bộ Google Calendar.

## 9. [Should] NFR — i18n UI (vi/en)

- Dùng Next.js i18n routing (`next-i18next` hoặc App Router i18n built-in — theo đúng phiên bản Next.js đang dùng trong repo).
- Chỉ dịch **UI chrome**: nút, nhãn, thông báo hệ thống, validation message.
- **Không** dịch nội dung do user tạo (bio, tin nhắn chat, từ đã lưu, definition/example trong thư viện từ) — giữ nguyên ngôn ngữ gốc.
- Thêm field `locale` (enum 'vi'|'en', default theo browser) vào USER hoặc lưu ở localStorage/cookie FE — không cần bảng mới.

---

## Business rules cần enforce (map với BR-12→BR-15 trong SRS)
- **BR-12**: `WORD_LIBRARY.is_public = true` khi `save_count >= 3` từ ≥3 user khác nhau.
- **BR-13**: `ENDORSEMENT` không có điểm trung bình/xếp hạng — chỉ đếm theo nhãn, `UNIQUE(giver_id, receiver_id, label)`.
- **BR-14**: Giờ chat cắt phiên theo idle > 30 phút, tính lại khi đọc (không cache).
- **BR-15**: `SCHEDULE_REQUEST` lưu UTC, auto-expire sau 48h không phản hồi.

## Việc KHÔNG làm ở đợt này (Later, đừng tự ý mở rộng)
Dịch in-chat tự động, correction ngữ pháp, media chat ngoài reaction (ảnh/voice/video), đăng bài tự do trên Community, đồng bộ calendar ngoài (.ics/Google), gamification nâng cao (streak, quiz), verification tài khoản.

## Sau khi code xong
- Viết migration file cho 6 bảng mới, chạy migration trên DB dev.
- Cập nhật ERD (thêm 6 entity vào sơ đồ hiện có — file gốc `ERD.png`/`ERD.mermaid` cần vẽ lại, hiện SRS đang ghi chú đây là việc còn thiếu).
- Test lại toàn bộ luồng core loop cũ (FS-01→22) để đảm bảo không có regression, đặc biệt FS-08 và FS-14 vừa sửa.
