# AGENTS.md — Stududu

Nguồn quy tắc chuẩn duy nhất cho mọi AI agent (Claude Code, Antigravity, ...) làm việc trong repo này. Đọc file này trước khi sửa bất kỳ code nào. Chi tiết đầy đủ từng chức năng nằm ở `docs/01-requirements/SRS-stududu.docx` (PHẦN 3 = đặc tả FS-xx, PHẦN 4 = ERD/Data Dictionary) — file này chỉ tóm tắt phần agent cần biết để không code sai.

## 1. Tổng quan dự án

Stududu — web trao đổi ngôn ngữ theo mô hình Tandem: người học được ghép với một người bản xứ/thành thạo để dạy lẫn nhau và trò chuyện trực tiếp, minh bạch và **không dựa trên credit/điểm số**.

- **Stack:** Next.js (FE) + NestJS (BE) + Socket.IO (realtime chat) + PostgreSQL.
- **Actor:** Guest (chưa đăng nhập) → Member (đã đăng ký) → Admin (role=admin, kiểm duyệt).
- **Team:** 4 người, khung ~7.5 tuần (29/6–20/8/2026) → phạm vi kỷ luật, ưu tiên core loop trước.
- **Backlog:** 28 user story (21 Must + 7 Should), chia theo module — xem bảng Sprint ở mục 6.

## 2. Nguyên tắc bắt buộc khi code

- **Giữ nguyên kiến trúc, coding convention, cấu trúc thư mục hiện có.** Không refactor tự phát ngoài phạm vi được giao.
- Mỗi tính năng làm xong phải chạy test/build trước khi chuyển sang mục tiếp theo.
- Nếu yêu cầu mơ hồ về hành vi hoặc dữ liệu — **hỏi lại**, không tự suy đoán rồi implement sai.
- ESLint + Prettier + TypeScript strict mode. Git workflow: `main` / `develop` / `feature/*` / `hotfix/*`.
- Không cache những gì SRS nói rõ "tính lại khi đọc" (MATCH_SCORE, giờ chat) — đây là quyết định kiến trúc có chủ đích cho MVP, không phải thiếu sót cần "tối ưu".

## 3. Business rules cốt lõi — KHÔNG được vi phạm

| Mã | Quy tắc |
|---|---|
| BR-01 | Mật khẩu ≥8 ký tự (chữ + số), lưu băm bcrypt |
| BR-02 | Khóa đăng nhập tạm 15 phút sau 5 lần sai liên tiếp |
| BR-03 | Session idle timeout 30 phút; link reset mật khẩu sống 30 phút |
| BR-04 | Điều kiện matching: mỗi user cần ≥1 ngôn ngữ vai trò (native\|fluent) + ≥1 learning |
| BR-05 | Bù trừ ngôn ngữ là điều kiện ghép **chính, bất biến**, không được nới; topic/level/last_active là phụ, nới theo đúng thứ tự đó khi thiếu ứng viên; MATCH_SCORE không cache |
| BR-06 | MATCH trạng thái `liked` → tự expired sau 14 ngày nếu không thành mutual |
| BR-07 | Skip → ẩn đối tác đó khỏi gợi ý trong 30 ngày |
| BR-08 | Chat **text-only** ở MVP (không ảnh/voice/video); reconnect không được làm mất tin đã gửi thành công |
| BR-09 | Block chặn 2 chiều (cả gợi ý lẫn chat) |
| BR-10 | Suspend leo thang: lần 1 = 3 ngày, lần 2 = 1 tuần, tái phạm tiếp = xóa cứng (hard delete, ẩn danh dữ liệu liên quan, không xóa theo) |
| BR-11 | Mọi chức năng Admin yêu cầu `role = admin`, mọi hành động phải ghi `MODERATION_ACTION` |
| BR-12 | `WORD_LIBRARY.is_public = true` khi `save_count ≥ 3` **từ ≥3 Member khác nhau** (không phải 3 lượt lưu của cùng 1 người) |
| BR-13 | **Endorsement không có điểm trung bình/xếp hạng — chỉ đếm số lượt theo nhãn cố định.** Đây là nguyên tắc "no-credit" cốt lõi của sản phẩm. Tuyệt đối không tự thêm `average_rating` hay field xếp hạng số. `UNIQUE(giver_id, receiver_id, label)`. |
| BR-14 | Giờ chat tính theo phiên, cắt phiên khi khoảng cách 2 tin nhắn liên tiếp > 30 phút (dùng lại idle timeout của BR-03); tính lại khi đọc, không cache; không tính giờ chat của hội thoại đã bị block 2 chiều |
| BR-15 | `SCHEDULE_REQUEST` lưu `proposed_time` dưới dạng **UTC**, hiển thị quy đổi theo timezone trình duyệt từng người; auto-expire sau 48h không phản hồi |

## 4. Quy ước i18n

- FE dùng Next.js i18n routing (`next-i18next` hoặc App Router i18n built-in — kiểm tra version Next.js trong repo trước khi chọn).
- Locale key convention: `[module].[screen].[element]` — ví dụ `auth.login.submit_button`, `vocabulary.save_word.error_duplicate`.
- 2 ngôn ngữ: `vi` (default) / `en`. Lưu `locale` ở USER hoặc localStorage/cookie FE (không cần bảng mới).
- **Chỉ dịch UI chrome:** nút, nhãn, thông báo hệ thống, validation message.
- **Không dịch nội dung do user tạo:** bio, tin nhắn chat, từ đã lưu, definition/example trong thư viện từ — giữ nguyên ngôn ngữ gốc. Đây là quyết định NFR đã chốt, không tự ý mở rộng sang dịch tự động in-chat.
- BE: trả message lỗi/response theo locale (header hoặc query param) — dùng pattern interceptor/pipe hiện có của NestJS.

## 5. Google Translate API (tính năng thêm từ mới)

- Không commit API key vào repo — dùng biến môi trường (`.env`, không track git).
- Cache kết quả dịch để tránh gọi API trùng, tốn quota.
- Có fallback khi API lỗi/timeout: cho user nhập tay, không chặn luồng thêm từ.

## 6. Bản đồ module & Sprint

| Module | FS | Ưu tiên | Sprint |
|---|---|---|---|
| Account & Auth | FS-01→03, FS-22 | Must (FS-22 Should) | Sprint 1 |
| Language Profile | FS-04→07 | Must (FS-06 Should) | Sprint 1 |
| Discovery & Matching | FS-08→13 | Must | Sprint 2 |
| 1:1 Text Chat | FS-14→16 | Must (FS-16 Should) | Sprint 3 |
| Trust (Report/Block) | FS-17→18 | Must | Sprint 3 |
| Admin/Moderation | FS-19→21 | Must (FS-21 Should) | Sprint 3 |
| Vocabulary | FS-23→24 | Must (FS-24 Should) | Sprint 4 |
| Community | FS-25 | Should | Sprint 4 |
| Trust mở rộng (Endorsement, thống kê giờ chat) | FS-26→27 | Must | Sprint 4 |
| Scheduling | FS-28 | Should | Sprint 4 |

Chi tiết luồng chính/ngoại lệ/validation của từng FS-xx: xem PHẦN 3 của `docs/01-requirements/SRS-stududu.docx`. Acceptance Criteria dạng Gherkin: xem Product Backlog & User Stories.

## 7. Việc KHÔNG làm (ngoài backlog hiện tại — Later, đừng tự ý mở rộng)

Dịch in-chat tự động, correction ngữ pháp, media chat ngoài reaction (ảnh/voice/video), đăng bài tự do trên Community (chỉ auto-generated post), đồng bộ calendar ngoài (.ics/Google Calendar), gamification nâng cao (streak, quiz), verification tài khoản, OAuth login, khung trình độ riêng theo ngôn ngữ (HSK/JLPT/TOPIK).

## 8. Định nghĩa Done

- Không còn text hardcode trong phạm vi đã đổi (nếu đang làm i18n).
- Test/build pass, không phá luồng cũ — đặc biệt các luồng core (FS-08 matching, FS-14 chat).
- Đối chiếu lại với business rules ở mục 3 trước khi coi là xong.

## 9. Luồng PR / review

- PR theo từng FS/User Story, không gộp nhiều US không liên quan vào 1 PR.
- Trước khi mở PR: tự chạy test, tự đối chiếu AGENTS.md.
- Reviewer kiểm tra: có vi phạm business rule nào ở mục 3 không, có hardcode text mới không.

## 10. Open questions chưa chốt (tra `docs/01-requirements/SRS-stududu.docx` mục 5.3 nếu cần chi tiết)

Component library (shadcn/ui vs MUI), nơi host DB (Supabase/Neon/Railway), ngân sách/giới hạn Google Translate API, danh sách nhãn Endorsement cố định đã đủ chưa. Nếu code đụng tới các điểm này mà chưa thấy quyết định trong repo — hỏi lại thay vì tự chọn.

## 11. Tài liệu tham khảo

- `docs/01-requirements/SRS-stududu.docx` — đặc tả đầy đủ (nguồn chuẩn, AGENTS.md chỉ là tóm tắt).
- `docs/02-design/ERD.png` — sơ đồ dữ liệu (bản cũ 14 entity, đang thiếu 6 entity mới: WORD_LIBRARY, USER_SAVED_WORD, ACTIVITY_POST, POST_LIKE, ENDORSEMENT, SCHEDULE_REQUEST — cần vẽ lại).
- `docs/03-planning/Phan-cong-cong-viec_16-20-07-2026.md` — phân công Sprint hiện tại.
- `docs/01-requirements/product-backlog-user-stories.md` — backlog & Acceptance Criteria dạng Gherkin.
- `docs/02-design/data-dictionary.md`, `docs/02-design/ui-ux-style-guide.md`, `docs/02-design/diagrams/` — thiết kế dữ liệu & UI.
- `docs/04-convention/coding-convention.md` — coding convention chi tiết (AGENTS.md mục 2 chỉ tóm tắt).
- `docs/05-prompts/` — prompt log dùng cho AI agent. `docs/_archive/` — bản tài liệu cũ, KHÔNG dùng để code.

## 12. Quy ước lưu tài liệu (docs/)

Mọi tài liệu dự án lưu trong `docs/`, chia theo giai đoạn. Tạo file mới phải đặt đúng nhánh, không để rải rác ở root repo:

| Thư mục | Chứa gì |
|---|---|
| `docs/01-requirements/` | SRS, vision & scope, product backlog, user stories |
| `docs/02-design/` | ERD, data dictionary, UI/UX style guide, các diagram (`diagrams/`) |
| `docs/03-planning/` | Roadmap, implementation plan, phân công Sprint, design decisions log |
| `docs/04-convention/` | Coding convention, rule template cho AI agent |
| `docs/05-prompts/` | Prompt log dùng với AI agent (tham khảo, không phải nguồn chuẩn) |
| `docs/_archive/` | Bản cũ đã bị thay thế — **không dùng để code**, chỉ để truy vết |

Quy tắc:

- **Một chủ đề = một file, một nguồn chuẩn.** Khi cập nhật tài liệu (vd SRS), ghi đè file hiện có; bản cũ chuyển vào `docs/_archive/` kèm hậu tố ngày (`SRS-stududu_v2_2026-06-30.docx`). Không để 2 file cùng nội dung khác tên ở 2 nơi.
- Tên file: chữ thường, gạch ngang, không dấu tiếng Việt, không khoảng trắng.
- `AGENTS.md` và `CLAUDE.md` **bắt buộc nằm ở root repo** — Claude Code và Antigravity chỉ đọc ở đó, di chuyển đi là mất tác dụng.
- Sửa/thêm tài liệu trong `docs/` mà làm thay đổi đường dẫn → cập nhật lại mục 11 của file này và phần "Tài liệu" trong `README.md`.
