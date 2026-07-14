# Data Dictionary — Web Trao đổi Ngôn ngữ (Core MVP)

**Version:** 1.0 · **Ngày:** 24/06/2026 · **Tác giả:** Vinh — BA · **Đi kèm:** `ERD.mermaid`

Companion của ERD, mô tả từng trường để Dev/QA dựng database. Phản ánh các quyết định đã chốt: `role = native | fluent | learning`, thang trình độ 1–5, `USER.role = member | admin`, vô hiệu hóa theo mức + lịch sử vi phạm, ẩn danh khi xóa cứng, và các tham số expiry.

> Kiểu dữ liệu là tạm thời (provisional) — cột quan trọng nhất là **Mô tả nghiệp vụ**. Dev chốt kiểu cụ thể theo DBMS.

---

## 1. USER
Người dùng (member hoặc admin).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| email | string | ✔ | Email đăng nhập | UNIQUE |
| password_hash | string | ✔ | Mật khẩu đã băm | ≥8 ký tự (chữ+số) trước khi băm |
| display_name | string | ✔ | Tên hiển thị | |
| avatar_url | string | | Ảnh đại diện | |
| bio | string | | Giới thiệu ngắn | US-06 |
| intent | string | | Mục tiêu học (study buddy, thi cử, casual…) | US-04/US-07 |
| role | string | ✔ | `member` \| `admin` | Phân quyền — US-19/20 |
| status | string | ✔ | `active` \| `suspended` \| `deleted` | US-20 |
| suspended_until | datetime | | Thời điểm hết hạn khóa (nếu suspended) | 3 ngày / 1 tuần |
| last_active | datetime | | Mốc hoạt động gần nhất | Chống ghosting — US-16 |
| created_at | datetime | ✔ | Ngày tạo | |

*Ghi chú:* khi **xóa cứng** (hard_delete), các bản ghi tham chiếu user này được **ẩn danh** (anonymize), không xóa theo — giữ toàn vẹn hội thoại của người còn lại.

## 2. LANGUAGE
Danh mục ngôn ngữ.

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| code | string | ✔ | Mã ngôn ngữ (en, vi, zh…) | |
| name | string | ✔ | Tên hiển thị | |
| framework | string | | Khung trình độ áp dụng (CEFR; HSK/JLPT/TOPIK để Later) | MVP mặc định CEFR |

## 3. USER_LANGUAGE — junction TRUNG TÂM
Ngôn ngữ của user kèm vai trò (nuôi thuật toán matching).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| user_id | int | ✔ | Thuộc user nào | FK → USER |
| language_id | int | ✔ | Ngôn ngữ nào | FK → LANGUAGE |
| role | string | ✔ | `native` \| `fluent` \| `learning` | Phía dạy = native+fluent; phía học = learning |
| level | string | | learning: thang 1–5; fluent: CEFR; native: null | US-04 |

## 4. TOPIC
Chủ đề sở thích (bộ lọc phụ).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| name | string | ✔ | Tên chủ đề | |

## 5. USER_INTEREST
Sở thích của user (junction USER ↔ TOPIC).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| user_id | int | ✔ | | FK → USER |
| topic_id | int | ✔ | | FK → TOPIC |

## 6. MATCH_PREFERENCE
Tiêu chí ghép của user (1 user có 0..1).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| user_id | int | ✔ | | FK → USER |
| intent | string | | study buddy / casual… | US-07 |
| language_focus | string | | Cặp/ngôn ngữ ưu tiên | |
| level_desired | string | | Mức trình độ đối tác mong muốn | |

## 7. MATCH
Cặp ghép đôi (tạo lazy khi có Like đầu).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| member_id | int | ✔ | Người chủ thể (Like) | FK → USER |
| candidate_id | int | ✔ | Người được ghép | FK → USER |
| status | string | ✔ | `liked` \| `mutual` \| `skipped` \| `expired` | US-11/12/13 |
| created_at | datetime | ✔ | | |
| expires_at | datetime | | Hết hạn sau **14 ngày** nếu không mutual | Tham số đã chốt |

## 8. MATCH_SCORE
Điểm match (tính lại khi đọc — không cache ở MVP).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| match_id | int | ✔ | | FK → MATCH |
| lang_complement | boolean | ✔ | Bù trừ ngôn ngữ — ĐIỂM CHÍNH | US-08 |
| shared_topic_count | int | | Số sở thích chung — điểm phụ | |
| intent_alignment | boolean | | Khớp intent — điểm cộng | |
| total | float | | Tổng điểm xếp hạng | |

## 9. INTERACTION
Hành động like/skip.

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| match_id | int | ✔ | | FK → MATCH |
| user_id | int | ✔ | Ai thực hiện | FK → USER |
| action | string | ✔ | `like` \| `skip` | US-11/12 |
| hidden_until | datetime | | Với skip: ẩn người đó **30 ngày** | Tham số đã chốt |
| created_at | datetime | ✔ | | |

## 10. CONVERSATION
Hội thoại 1:1 (tạo khi mutual).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| match_id | int | ✔ | Sinh từ MATCH mutual | FK → MATCH |
| created_at | datetime | ✔ | | |

## 11. MESSAGE
Tin nhắn text (real-time).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| conversation_id | int | ✔ | | FK → CONVERSATION |
| sender_id | int | ✔ | Người gửi | FK → USER |
| content | string | ✔ | Nội dung (text-only MVP) | US-14 |
| sent_at | datetime | ✔ | | |
| read_at | datetime | | Thời điểm đọc (cho unread) | US-15 |

## 12. REPORT
Báo cáo vi phạm.

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| reporter_id | int | ✔ | Người báo | FK → USER |
| reported_id | int | ✔ | Người bị báo | FK → USER |
| reason | string | ✔ | Lý do | US-17 |
| status | string | ✔ | `open` \| `reviewed` \| `dismissed` | US-19 |
| created_at | datetime | ✔ | | |

## 13. BLOCK
Chặn liên hệ.

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| blocker_id | int | ✔ | Người chặn | FK → USER |
| blocked_id | int | ✔ | Người bị chặn | FK → USER |
| created_at | datetime | ✔ | | US-18 |

## 14. MODERATION_ACTION — log + lịch sử vi phạm
Ghi mọi hành động kiểm duyệt; đồng thời là **lịch sử vi phạm** để xác định "tái phạm" (quyết định leo thang suspend → xóa cứng).

| Field | Kiểu | Bắt buộc? | Mô tả nghiệp vụ | Ràng buộc / Nguồn |
|-------|------|:---------:|-----------------|-------------------|
| id | int | ✔ | Khóa chính | PK |
| admin_id | int | ✔ | Admin thực hiện | FK → USER (role=admin) |
| target_user_id | int | ✔ | Người bị xử lý | FK → USER |
| action | string | ✔ | `warn` \| `suspend_3d` \| `suspend_1w` \| `hard_delete` | US-19/20 |
| reason | string | ✔ | Lý do | |
| created_at | datetime | ✔ | Mốc thời gian (để đếm tái phạm) | |

---

## Quan hệ chính

- USER 1—* USER_LANGUAGE *—1 LANGUAGE (một user khai nhiều ngôn ngữ kèm role) — *nuôi thuật toán matching*.
- USER 1—* USER_INTEREST *—1 TOPIC (sở thích — bộ lọc phụ).
- USER 1—0..1 MATCH_PREFERENCE.
- USER 1—* MATCH (vai member) và 1—* MATCH (vai candidate).
- MATCH 1—0..1 MATCH_SCORE; MATCH 1—* INTERACTION.
- MATCH (mutual) 1—0..1 CONVERSATION 1—* MESSAGE; USER 1—* MESSAGE (sender).
- USER 1—* REPORT (reporter / reported); USER 1—* BLOCK (blocker / blocked).
- USER(admin) 1—* MODERATION_ACTION *—1 USER(target).

## Vòng đời (state) — cần state diagram riêng

- **MATCH.status:** `liked` → `mutual` (cả hai Like) | `skipped` | `expired` (sau 14 ngày).
- **USER.status:** `active` → `suspended` (3d/1w, tự về active khi hết hạn) → tái phạm → `deleted` (ẩn danh dữ liệu liên quan).

## Mở rộng (Should / Later — chưa trong backlog Must)

Để forward-compatible, dự kiến thêm khi làm các feature Should/Later:

- **PROFILE_LIKE** (liker_id, liked_id, created_at) — like trên profile, chỉ sau ≥2 ngày trao đổi.
- **REFERENCE** (author_id, target_id, content, created_at) — comment/đánh giá định tính, sau ≥2 ngày, không chấm điểm.
- **AVAILABILITY** (user_id, timezone, time_slots) — phục vụ lập lịch theo múi giờ.
- **PASSWORD_RESET** (user_id, token, expires_at 30 phút) — bảng kỹ thuật cho US-22.

## Assumptions & Open questions

- ERD ở mức **conceptual/logical** — chưa gồm index, bảng kỹ thuật (session token), audit chi tiết.
- "Tái phạm" xác định bằng đếm `MODERATION_ACTION` của target_user_id — cần chốt ngưỡng chính xác (vd: suspend lần 2 → 1 tuần, lần 3 → xóa).
- Avatar/ảnh: lưu URL (giả định dùng dịch vụ lưu trữ ngoài) — chốt ở phần tech stack.
- Cần một **state diagram** cho MATCH.status và USER.status (mình làm tiếp nếu bạn muốn).
