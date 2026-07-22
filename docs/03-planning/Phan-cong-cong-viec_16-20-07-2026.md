# Stududu — Phân công công việc sau review với Mentor

**Phạm vi:** 16/07 – 20/07/2026 (4 ngày) · **Trạng thái:** Draft — cần team xác nhận số lượng thành viên và Google API key trước khi bắt đầu Day 1

## 1. Sprint Goal

Đưa Stududu vận hành đa ngôn ngữ (i18n) trên cả BE/FE, rút ngắn thao tác thêm từ mới nhờ gợi ý dịch tự động, và để lại một bộ quy tắc dùng chung (AGENTS.md) giúp cả team — dù dùng Claude Code hay Antigravity — code nhất quán với nhau.

## 2. Bối cảnh & thứ tự ưu tiên (theo mentor)

1. **i18n BE + FE** — ưu tiên cao nhất, làm trước.
2. **Cải thiện chức năng thêm từ mới** bằng Google Translate API.
3. **Refactor + hiểu code** BE và FE.
4. **Tận dụng agent team (AI)** để tăng tốc 3 việc trên, đồng thời tìm hiểu cách setup agent team (skills, rules, docs) dùng chung cho cả nhóm.

Vì mốc hoàn thành là 20/07 (4 ngày làm việc), mục 3 và 4 không thể làm "trọn vẹn" — kế hoạch bên dưới coi đó là công việc chạy song song ở mức tối thiểu khả thi (MVP), không phải rewrite toàn bộ codebase.

## 3. Team & vai trò

Giả định 4 người, chia rõ BE/FE (điều chỉnh nếu team chỉ có 3 — xem ghi chú cuối bảng):

| Vai trò | Người | Trọng tâm |
|---|---|---|
| BA / Coordinator + Agent-tooling lead | Vinh | Viết AGENTS.md, theo dõi tiến độ, viết AC, tổng hợp báo cáo cho mentor |
| Backend Dev | BE Dev | i18n BE, tích hợp Google Translate API (server-side), refactor BE |
| Frontend Dev | FE Dev | i18n FE, UI gợi ý dịch khi thêm từ, refactor FE |
| Dev hỗ trợ (BE hoặc FE) | Dev #4 | Hỗ trợ mảng đang chậm nhất mỗi ngày; ưu tiên phụ trách xử lý lỗi/rate-limit của Google API |

*Nếu chỉ có 3 người:* bỏ Dev #4, dồn phần "hỗ trợ Google API lỗi/rate-limit" cho BE Dev, dồn phần refactor FE cho FE Dev tự làm ở mức tối thiểu (dọn code trùng lặp rõ nhất, bỏ qua phần ít rủi ro).

## 4. Backlog ưu tiên

| # | Hạng mục | Loại | Ưu tiên | Lý do thứ tự |
|---|---|---|---|---|
| BL1 | i18n Backend (API messages, error codes, email/notification templates) | Tech | Must | Mentor yêu cầu làm trước; FE phụ thuộc vào key/format do BE định nghĩa |
| BL2 | i18n Frontend (UI text, chọn ngôn ngữ vi/en) | Story | Must | Làm song song BL1 sau khi thống nhất key convention |
| BL3 | Thêm từ mới: gợi ý nghĩa qua Google Translate API | Story | Must/Should | Giá trị người dùng rõ, nhưng phụ thuộc BL1 (locale) đã ổn định |
| BL4 | Refactor + tài liệu hoá luồng chính BE | Tech | Should | Cần để team (và AI agent) hiểu code trước khi sửa sâu hơn |
| BL5 | Refactor + tài liệu hoá luồng chính FE | Tech | Should | Tương tự BL4 |
| BL6 | AGENTS.md + quy tắc dùng chung cho Claude Code & Antigravity | Tech/Spike | Should | Làm sớm, chi phí thấp, giúp BL1–BL5 chạy nhất quán hơn khi có AI hỗ trợ |

## 5. Phân công theo ngày

**Ngày 1 — Thứ Năm 16/07 (Scaffolding & thống nhất chuẩn)**

| Người | Việc |
|---|---|
| Vinh | Viết bản nháp `AGENTS.md` (coding convention hiện có, quy ước i18n key, Definition of Done, luồng PR/review); dựng CLAUDE.md import; viết hướng dẫn 1 trang cho người dùng Antigravity (mục 6) |
| BE Dev | Audit BE: liệt kê toàn bộ chuỗi hardcode cần i18n, chọn thư viện (vd i18next/gettext tuỳ stack), thiết kế locale detection (header/param) |
| FE Dev | Audit FE: liệt kê text hardcode, chọn thư viện i18n FE, dựng cấu trúc `vi.json`/`en.json` |
| Dev #4 | Đăng ký/lấy Google Translate API key, kiểm tra hạn mức miễn phí & billing, viết PoC gọi thử API |

**Ngày 2 — Thứ Sáu 17/07 (Implement i18n + bắt đầu Translate API)**

| Người | Việc |
|---|---|
| Vinh | Viết User Stories + Acceptance Criteria cho BL2, BL3; review AGENTS.md cùng team, chốt bản v1 |
| BE Dev | Implement i18n cho API response & error messages; dựng service wrapper gọi Google Translate API (có cache để tránh gọi trùng, tốn quota) |
| FE Dev | Áp i18n vào các màn hình chính (login/đăng ký, matching, chat); dựng UI switch ngôn ngữ |
| Dev #4 | Nối UI "thêm từ mới" với service dịch của BE; xử lý trạng thái loading/lỗi khi gọi API |

**Ngày 3 — Thứ Bảy 18/07 (Hoàn thiện tính năng + refactor)**

| Người | Việc |
|---|---|
| Vinh | Đọc diff code của BE/FE, đối chiếu với AGENTS.md, ghi chú điểm lệch chuẩn; cập nhật SRS phần liên quan |
| BE Dev | Hoàn thiện BL3 (fallback khi API fail/timeout — cho nhập tay); refactor 1-2 module lõi (vd vocabulary service, matching), thêm docstring/comment cho phần logic phức tạp |
| FE Dev | Hoàn thiện UI gợi ý dịch (cho sửa trước khi lưu); refactor component trùng lặp, dọn state quản lý ngôn ngữ |
| Dev #4 | Viết test case cho BL3 (happy path + API lỗi/timeout); hỗ trợ refactor phần còn thiếu người |

**Ngày 4 — Chủ Nhật 19/07 → Thứ Hai 20/07 (Test, polish, chuẩn bị demo)**

| Người | Việc |
|---|---|
| Vinh | Tổng hợp báo cáo tiến độ cho mentor; xác nhận Definition of Done từng hạng mục; chuẩn bị demo flow |
| BE Dev | Test tích hợp, fix bug i18n/API; review code cùng Vinh |
| FE Dev | Test đa ngôn ngữ trên các màn hình chính, fix bug UI; review code cùng Vinh |
| Dev #4 | Regression test các luồng cũ (đảm bảo refactor không phá chức năng hiện có) |

## 6. AGENTS.md — dùng chung giữa Claude Code và Antigravity

Vì Vinh dùng Claude Code còn các bạn khác dùng Antigravity, cách hợp lý là **một file luật duy nhất, mỗi công cụ đọc theo cách riêng**, thay vì viết 2 bộ quy tắc riêng biệt dễ lệch nhau:

1. Tạo `AGENTS.md` ở root repo — đây là nguồn chuẩn duy nhất: coding convention, quy ước đặt tên i18n key, Definition of Done, luồng PR/review, lưu ý về Google API (rate limit, không commit key).
2. **Claude Code** không tự đọc `AGENTS.md`, nhưng đọc `CLAUDE.md`. Vinh chỉ cần tạo `CLAUDE.md` với dòng đầu tiên là `@AGENTS.md` — Claude Code sẽ tự import toàn bộ nội dung khi mở project (có hỏi xác nhận lần đầu). Phần riêng cho Claude Code (nếu có) viết thêm bên dưới dòng import.
3. **Antigravity** tự động đọc `~/.gemini/GEMINI.md` (rule toàn cục) nhưng KHÔNG tự đọc `AGENTS.md`/`CLAUDE.md`. Mỗi bạn dùng Antigravity cần tự thêm 1 rule cá nhân (một lần, không cần commit vào repo) vào `~/.gemini/GEMINI.md`:
   ```
   - Luôn kiểm tra file AGENTS.md ở root project workspace và áp dụng các quy tắc trong đó.
   - Có thể có thêm AGENTS.md ở sub-folder với quy tắc riêng cho phần đó của code.
   ```
   (Bản Antigravity từ 05/03/2026 trở lên có hỗ trợ đọc AGENTS.md trực tiếp — nếu team đang dùng bản mới, kiểm tra lại xem còn cần bước này không.)
4. Kết quả: cả Claude Code và Antigravity đều tuân theo cùng một `AGENTS.md`, chỉnh 1 chỗ là cả team đồng bộ.

## 7. Definition of Done

- **BL1/BL2 (i18n):** không còn text hardcode ở UI và error message; chuyển vi ↔ en không lỗi; test thủ công trên các màn hình chính.
- **BL3 (Translate API):** thêm từ mới gọi được gợi ý dịch, cho phép sửa trước khi lưu; có fallback khi API lỗi/timeout (nhập tay); không lộ API key trong code/commit.
- **BL4/BL5 (Refactor):** có ghi chú/docstring cho luồng chính; code trùng lặp rõ ràng được gộp; toàn bộ chức năng cũ vẫn chạy đúng (regression pass) — không refactor kiểu "viết lại từ đầu" trong 4 ngày này.
- **BL6 (AGENTS.md):** file tồn tại ở root, `CLAUDE.md` import thành công, mọi thành viên Antigravity đã set rule cá nhân, cả team xác nhận đã đọc qua 1 lần.

## 8. Rủi ro & giả định cần xác nhận

- **Rủi ro:** 4 ngày là rất gấp cho cả 4 hạng mục cùng lúc — nếu trễ, ưu tiên giữ BL1/BL2 (mentor yêu cầu trước), lùi bớt phạm vi BL4/BL5.
- **Rủi ro:** Google Translate API cần billing/API key — nếu chưa có ai đứng ra đăng ký, Day 1 sẽ bị block. Cần chốt ngay ai giữ key.
- **Rủi ro:** Claude Code và Antigravity có thể diễn giải cùng một AGENTS.md khác nhau đôi chút — luôn review output của AI trước khi merge, không tin tuyệt đối.

**Open questions cần xác nhận với mentor/team:**
- Số lượng và tên thành viên chính xác (đang giả định 4 người).
- Ngôn ngữ đích ngoài vi/en có cần không (vd thêm ngôn ngữ thứ 3)?
- Ai chịu trách nhiệm chi phí/API key Google Translate?
- Phạm vi refactor BL4/BL5 giới hạn ở module nào là đủ trong 4 ngày, hay chỉ cần "hiểu code" (đọc + tài liệu hoá) mà chưa cần sửa?
