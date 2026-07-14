# Product Backlog & User Stories — stududu (Web Trao đổi Ngôn ngữ) · Core Loop MVP

**Version:** 1.4 · **Ngày:** 24/06/2026 · **Tác giả:** Vinh — BA/PO · **Trạng thái:** Đặt tên app "stududu"; thêm mục 1.2 Backlog ý tưởng (Should/Later)

Phạm vi tài liệu: **5 feature Must** (core loop) — Account & Auth, Language Profile, Discovery & Matching, 1:1 Text Chat, Trust. Đây là đầu vào để Dev ước tính và code Sprint 1–3. Các tính năng Should/Later (dịch, correction, like/reference, lập lịch, "thành viên tích cực"…) **không** nằm trong backlog này; sẽ bổ sung sau khi chốt với mentor.

> **Story Point (SP)** dùng thang Fibonacci (1, 2, 3, 5, 8, 13). Đây là **ước lượng đề xuất của PO/BA** để lập kế hoạch — Dev cần rà lại và chốt ở Sprint Planning; con số có thể đổi. (S/M/L chỉ là gợi ý độ lớn.)
>
> **Cột Giờ** quy đổi từ SP theo tỉ lệ **1 SP ≈ 4 dev-giờ** (1 dev-ngày = 8h) — là giờ làm thực (ideal hours) cho 1 story, chưa tính họp/nghỉ. Dùng để nhập vào phần mềm quản lý dự án và hiệu chỉnh lại sau Sprint 1.

---

## 1. Backlog tổng quan & ánh xạ Sprint

| ID | User Story | Epic | Priority | Size | SP | Giờ | Sprint dự kiến |
|----|------------|------|:--------:|:----:|:--:|:--:|:--------------:|
| US-01 | Đăng ký tài khoản | Auth | Must | M | 5 | 20 | Sprint 1 |
| US-02 | Đăng nhập | Auth | Must | S | 3 | 12 | Sprint 1 |
| US-03 | Đăng xuất & quản lý session | Auth | Must | S | 3 | 12 | Sprint 1 |
| US-22 | Khôi phục mật khẩu | Auth | Should | S | 3 | 12 | Sprint 1 |
| US-04 | Khai ngôn ngữ + trình độ | Profile | Must | M | 5 | 20 | Sprint 1 |
| US-05 | Chọn sở thích (Topic) | Profile | Must | S | 2 | 8 | Sprint 1 |
| US-06 | Hoàn thiện thông tin & gợi ý hồ sơ | Profile | Should* | M | 5 | 20 | Sprint 1 |
| US-07 | Đặt tiêu chí ghép (MATCH_PREFERENCE) | Profile | Must | S | 3 | 12 | Sprint 1 |
| US-08 | Xem gợi ý bù trừ ngôn ngữ | Matching | Must | L | 8 | 32 | Sprint 2 |
| US-09 | Lọc gợi ý | Matching | Must | M | 5 | 20 | Sprint 2 |
| US-10 | Xem profile đối tác + lý do match | Matching | Must | S | 3 | 12 | Sprint 2 |
| US-11 | Like (tạo MATCH lazy) | Matching | Must | M | 5 | 20 | Sprint 2 |
| US-12 | Skip | Matching | Must | S | 2 | 8 | Sprint 2 |
| US-13 | Mutual match → mở chat | Matching | Must | M | 5 | 20 | Sprint 2 |
| US-14 | Nhắn tin text real-time | Chat | Must | L | 8 | 32 | Sprint 3 |
| US-15 | Lịch sử trò chuyện (Inbox) | Chat | Must | M | 5 | 20 | Sprint 3 |
| US-16 | Trạng thái hoạt động (last_active) | Chat | Should* | S | 3 | 12 | Sprint 3 |
| US-17 | Report người dùng | Trust | Must | S | 2 | 8 | Sprint 3 |
| US-18 | Block / Unblock | Trust | Must | S | 3 | 12 | Sprint 3 |
| US-19 | Admin xem & xử lý report | Admin | Must | M | 5 | 20 | Sprint 3 |
| US-20 | Admin vô hiệu hóa (3d/1w) / xóa cứng khi tái phạm | Admin | Must | M | 5 | 20 | Sprint 3 |
| US-21 | Admin quản lý danh mục (taxonomy) | Admin | Should | S | 3 | 12 | Sprint 3 / post-MVP |

\* US-06 và US-16 không thuộc 5 Must lõi nhưng rẻ và tác động lớn (hoàn tất hồ sơ; chống ghosting) → đề xuất kèm ngay trong sprint tương ứng.

\* *Admin* (US-19→21, feature #8) — đã đưa vào MVP (Sprint 3) theo quyết định. Lưu ý capacity: Sprint 3 đang gánh Chat (L) + Trust + Admin → nếu quá tải, đẩy US-21 sang tuần 8/post-MVP.

**Walking skeleton (Sprint 1):** lấy lát mỏng xuyên suốt — bản tối giản của US-01/02 + US-04 + một gợi ý tĩnh + 1 tin chat — để có luồng end-to-end demo được sớm, rồi làm dày từng phần ở Sprint 2–3.

### 1.1 Story Point & Ước lượng thời gian — Lịch dự án 29/6 – 20/8/2026

Tổng **91 SP ≈ 364 dev-giờ / 22 stories** (Must: 77 SP; Should: 14 SP — đây là "van xả" nếu trễ). Quy đổi 1 SP ≈ 4 dev-giờ.

| Giai đoạn | Thời gian | SP | Giờ | Trọng tâm |
|-----------|-----------|:--:|:--:|-----------|
| Sprint 0 | 29/6 – 5/7 (1 tuần) | — | — | Chuẩn bị: ERD, wireframe, tech stack, spike realtime, base FE/BE + Git |
| Sprint 1 | 6/7 – 19/7 (2 tuần) | 29 | 116 | Auth + Profile + walking skeleton |
| Sprint 2 | 20/7 – 2/8 (2 tuần) | 28 | 112 | Discovery & Matching (spine) |
| Sprint 3 | 3/8 – 16/8 (2 tuần) | 34* | 136 | Chat + Trust + Admin |
| Hardening + Demo | 17/8 – 20/8 (4 ngày) | overflow | — | Bug-fix, Pentest, demo cuối kỳ |
| **Tổng (build)** | | **91** | **364** | |

\* **Cảnh báo capacity:** Sprint 3 = 34 SP — nặng nhất (gấp ~1.2× S1/S2) lại trùng phần rủi ro cao nhất (realtime chat). Đề xuất **đẩy US-16 (3) + US-21 (3) ra khỏi cam kết Sprint 3** → còn 28 SP, cân bằng với S1/S2; làm 2 story đó ở cửa sổ hardening nếu kịp.

**Về ước lượng thời gian — nói thẳng:** SP là tương đối, nên *chưa thể* tính chính xác ngày hoàn thành khi chưa biết **velocity** của nhóm. Lịch trên giả định nhóm chạy được **~28–30 SP/sprint**. Bạn **chỉ biết velocity thật sau khi kết thúc Sprint 1** — đó là mốc hiệu chỉnh kế hoạch. Nếu Sprint 1 đạt thấp hơn, cắt các story **Should** trước (US-06, US-16, US-22, US-21).

> **Đối chiếu nhanh:** 364h ÷ 3 dev ÷ ~6 tuần build ≈ **~4 giờ làm thực/người/ngày**. Phần còn lại trong ngày dành cho họp, học công nghệ, test và tích hợp — nên lịch có buffer; nhưng buffer mỏng đi nếu velocity thấp hoặc realtime/matching phát sinh.

### 1.2 Backlog ý tưởng — Should/Later (chưa thuộc cam kết 8 tuần)

Các tính năng dưới đây NẰM NGOÀI MVP Must; đã/đang thiết kế UI trong prototype Figma (app tên **stududu**), nhưng **chưa ước tính SP và chưa xếp vào sprint** — sẽ chi tiết hoá khi quyết đưa vào.

| Tính năng | Mô tả ngắn | Ưu tiên |
|---|---|---|
| Lập lịch theo múi giờ | Đặt tối đa **2 khung giờ rảnh/ngày**; hiển thị **song song giờ của cả 2 quốc gia**; mời "hẹn giờ trò chuyện" trong chat | Should |
| Dịch trong chat | Dịch từng tin (toggle ẩn/hiện) + panel Dịch (nguồn "Tự nhận diện" → đích, 2 ô) kiểu Tandem; qua API dịch | Should |
| Media trong chat | Gửi ảnh, chụp ảnh, emoji picker | Could |
| **Sổ từ vựng (MỚI)** | Lưu từ mới/từ hay; màn danh sách có tìm kiếm + nhãn (Từ mới / Từ hay); lưu từ ngay trong tin nhắn | Could |
| Like + Reference | Like trên profile + comment định tính (sau ≥2 ngày trao đổi) | Should |
| Correction in-chat | Đối tác sửa câu sai (partner-correction) | Later |
| Verification nhẹ · "Thành viên tích cực tuần" · Video call | (xem SRS — Mở rộng) | Should/Later |

**Nguyên tắc:** không chen các mục này trước khi core loop 5 Must xong.

---

## 2. Epics

| Epic | Mô tả | Stories |
|------|-------|---------|
| **E1. Account & Auth** | Đăng ký, đăng nhập, session | US-01 → US-03 |
| **E2. Language Profile** | Khai ngôn ngữ/level, sở thích, hồ sơ, tiêu chí ghép | US-04 → US-07 |
| **E3. Discovery & Matching** | Ghép bù trừ, gợi ý, like/skip, mutual (xương sống) | US-08 → US-13 |
| **E4. 1:1 Text Chat** | Nhắn tin real-time, inbox, trạng thái hoạt động | US-14 → US-16 |
| **E5. Trust** | Report, block | US-17 → US-18 |
| **E6. Admin / Moderation** | Xử lý report, vô hiệu hóa/xóa tài khoản, quản lý taxonomy | US-19 → US-21 |

---

## 3. User Stories chi tiết

### Epic 1 — Account & Auth

#### [US-01] Đăng ký tài khoản
**Story:** Là **Guest**, tôi muốn đăng ký bằng email + mật khẩu, để **có tài khoản và bắt đầu tìm đối tác luyện ngôn ngữ**.

**Acceptance Criteria:**

AC1 — Đăng ký thành công
- **Given** Guest ở trang đăng ký với một email chưa tồn tại
- **When** nhập email hợp lệ + mật khẩu đạt yêu cầu rồi xác nhận
- **Then** hệ thống tạo tài khoản, đăng nhập và chuyển tới onboarding hồ sơ ngôn ngữ

AC2 — Email đã tồn tại
- **Given** email đã được đăng ký trước đó
- **When** Guest đăng ký lại với email đó
- **Then** hệ thống báo "email đã tồn tại" và không tạo tài khoản

AC3 — Mật khẩu không đạt
- **Given** Guest nhập mật khẩu không đạt độ mạnh tối thiểu
- **When** submit
- **Then** hệ thống báo lỗi rõ điều kiện và không tạo tài khoản

**Notes:** Out of scope: đăng ký bằng OAuth/Google (Later). Size: M.
**Tham số (đã chốt — chuẩn phổ thông):** Mật khẩu ≥ 8 ký tự, gồm cả chữ và số (khuyến nghị thêm ký tự đặc biệt). Xác minh email: tùy chọn (gắn Verification — Should).

#### [US-02] Đăng nhập
**Story:** Là **Member**, tôi muốn đăng nhập bằng email + mật khẩu, để **truy cập hồ sơ và các cuộc trò chuyện của mình**.

**Acceptance Criteria:**

AC1 — Đăng nhập đúng
- **Given** Member có tài khoản hợp lệ
- **When** nhập đúng email + mật khẩu
- **Then** hệ thống tạo session và chuyển vào trang chính

AC2 — Sai thông tin
- **Given** Member ở trang đăng nhập
- **When** nhập sai mật khẩu
- **Then** hệ thống báo lỗi, không tạo session, không tiết lộ email có tồn tại hay không

**Notes:** Size: S. **Tham số (đã chốt):** Khoá đăng nhập tạm 15 phút sau 5 lần sai liên tiếp.

#### [US-03] Đăng xuất & quản lý session
**Story:** Là **Member**, tôi muốn đăng xuất, để **bảo vệ tài khoản khi dùng máy chung**.

**Acceptance Criteria:**

AC1 — Đăng xuất
- **Given** Member đã đăng nhập
- **When** chọn Đăng xuất
- **Then** session bị hủy và chuyển về trang khách

AC2 — Session hết hạn
- **Given** session đã quá thời gian không hoạt động cho phép
- **When** Member thực hiện thao tác cần đăng nhập
- **Then** hệ thống yêu cầu đăng nhập lại

**Notes:** Size: S. **Tham số (đã chốt):** Session hết hạn sau 30 phút không hoạt động (idle timeout).

#### [US-22] Khôi phục mật khẩu
**Story:** Là **Member**, tôi muốn đặt lại mật khẩu khi quên, để **lấy lại quyền truy cập tài khoản**.

**Acceptance Criteria:**

AC1 — Gửi yêu cầu đặt lại
- **Given** Member ở trang "Quên mật khẩu"
- **When** nhập email đã đăng ký
- **Then** hệ thống gửi liên kết/mã đặt lại tới email (không tiết lộ email có tồn tại hay không)

AC2 — Đặt mật khẩu mới
- **Given** Member mở liên kết đặt lại còn hiệu lực
- **When** nhập mật khẩu mới hợp lệ
- **Then** mật khẩu được cập nhật và Member đăng nhập được bằng mật khẩu mới

AC3 — Liên kết hết hạn
- **Given** liên kết đặt lại đã quá hạn
- **When** Member mở liên kết
- **Then** hệ thống báo hết hạn và mời gửi lại

**Notes:** Priority Should. Size: S. Tham số: liên kết đặt lại sống 30 phút.

---

### Epic 2 — Language Profile

#### [US-04] Khai ngôn ngữ + trình độ
**Story:** Là **Member**, tôi muốn khai ngôn ngữ mẹ đẻ / thành thạo / đang học kèm trình độ, để **hệ thống ghép tôi với đối tác bù trừ phù hợp**.

**Acceptance Criteria:**

AC1 — Thêm ngôn ngữ đang học với thang 1–5
- **Given** Member ở bước onboarding hồ sơ
- **When** thêm một ngôn ngữ role = learning và chọn level theo thang 1–5
- **Then** hệ thống lưu và hiển thị ngôn ngữ đó kèm level trên hồ sơ

AC2 — Ngôn ngữ mẹ đẻ không cần level
- **Given** Member thêm ngôn ngữ role = native
- **When** lưu
- **Then** hệ thống không yêu cầu level cho ngôn ngữ đó

AC3 — Đủ điều kiện tham gia matching
- **Given** Member có ≥1 ngôn ngữ phía "dạy được" (native/fluent) và ≥1 ngôn ngữ learning
- **When** hoàn tất hồ sơ
- **Then** Member đủ điều kiện vào matching; nếu thiếu, hệ thống nhắc bổ sung

**Notes:** role = native | fluent | learning; fluent dùng khung CEFR. Size: M.
**Quyết định (đã chốt):** Cho khai & dạy ngôn ngữ role = fluent (ngoài native) — có. role = native | fluent | learning; fluent dùng CEFR.

#### [US-05] Chọn sở thích (Topic)
**Story:** Là **Member**, tôi muốn chọn các chủ đề sở thích, để **hệ thống xếp hạng gợi ý sát hơn và tôi có chủ đề để bắt chuyện**.

**Acceptance Criteria:**

AC1 — Chọn sở thích
- **Given** Member ở phần hồ sơ
- **When** chọn 3–5 Topic
- **Then** hệ thống lưu và dùng làm điểm phụ khi xếp hạng match

AC2 — Bỏ qua được
- **Given** Member chưa chọn Topic nào
- **When** tiếp tục
- **Then** hệ thống vẫn cho tham gia matching (Topic là bộ lọc phụ, không bắt buộc)

**Notes:** Size: S.

#### [US-06] Hoàn thiện thông tin & gợi ý hồ sơ
**Story:** Là **Member**, tôi muốn điền bio / mục tiêu / ảnh với gợi ý từ hệ thống, để **hồ sơ hấp dẫn hơn và được ghép tốt hơn**.

**Acceptance Criteria:**

AC1 — Thanh hoàn thiện hồ sơ
- **Given** Member ở trang hồ sơ
- **When** xem hồ sơ
- **Then** hệ thống hiển thị % hoàn thiện và gợi ý mục còn thiếu (vd "thêm sở thích để được ghép tốt hơn")

AC2 — Gợi ý mẫu bio
- **Given** Member chưa có bio
- **When** mở ô bio
- **Then** hệ thống hiển thị mẫu gợi ý ("Mình học tiếng… vì…")

AC3 — Lưu thay đổi
- **Given** Member chỉnh sửa hồ sơ
- **When** lưu
- **Then** thay đổi được phản ánh trên hồ sơ hiển thị

**Notes:** Priority Should* (rẻ, tăng tỉ lệ hoàn tất hồ sơ — một chỉ số thành công). Size: M.

#### [US-07] Đặt tiêu chí ghép (MATCH_PREFERENCE)
**Story:** Là **Member**, tôi muốn đặt tiêu chí ghép (cặp ngôn ngữ, intent, level mong muốn), để **chỉ thấy đối tác phù hợp với nhu cầu của mình**.

**Acceptance Criteria:**

AC1 — Đặt tiêu chí
- **Given** Member ở phần thiết lập matching
- **When** chọn cặp ngôn ngữ ưu tiên, intent, level mong muốn
- **Then** hệ thống lưu MATCH_PREFERENCE

AC2 — Áp vào gợi ý
- **Given** Member đã đặt tiêu chí
- **When** xem danh sách gợi ý
- **Then** danh sách phản ánh đúng tiêu chí đã đặt

**Notes:** Size: S.

---

### Epic 3 — Discovery & Matching (xương sống)

#### [US-08] Xem gợi ý bù trừ ngôn ngữ
**Story:** Là **Member**, tôi muốn xem danh sách đối tác bù trừ ngôn ngữ, để **tìm được người có thể dạy/học lẫn nhau**.

**Acceptance Criteria:**

AC1 — Danh sách thỏa điều kiện bù trừ
- **Given** Member có hồ sơ ngôn ngữ hợp lệ
- **When** mở trang gợi ý
- **Then** hệ thống chỉ hiển thị đối tác thỏa điều kiện bù trừ (tồn tại L1, L2 sao cho learning của tôi khớp native/fluent của họ và ngược lại)

AC2 — Xếp hạng theo MATCH_SCORE
- **Given** có nhiều đối tác thỏa điều kiện
- **When** hiển thị danh sách
- **Then** sắp xếp theo MATCH_SCORE = lang_complement (chính) + shared_topic_count (phụ) + intent_alignment (cộng)

AC3 — Thiếu sở thích chung vẫn hiển thị
- **Given** một đối tác bù trừ nhưng không có Topic chung
- **When** xếp hạng
- **Then** vẫn hiển thị, chỉ xếp ưu tiên thấp hơn (không loại)

AC4 — Trạng thái rỗng
- **Given** chưa có đối tác nào phù hợp
- **When** mở trang gợi ý
- **Then** hiển thị empty state với gợi ý (vd nới tiêu chí, bổ sung ngôn ngữ)

**Notes:** MATCH_SCORE tính on-the-fly, không cache ở MVP. Size: L (spine — rủi ro cao nhất về logic).
**Open questions:** Quy tắc xếp hạng phụ khi điểm bằng nhau (theo last_active? level?).

#### [US-09] Lọc gợi ý
**Story:** Là **Member**, tôi muốn lọc gợi ý theo cặp ngôn ngữ / level / sở thích, để **thu hẹp về đúng đối tác mình muốn**.

**Acceptance Criteria:**

AC1 — Áp một bộ lọc
- **Given** Member ở trang gợi ý
- **When** chọn lọc theo một cặp ngôn ngữ
- **Then** danh sách chỉ còn đối tác khớp cặp đó

AC2 — Kết hợp nhiều bộ lọc
- **Given** Member chọn nhiều tiêu chí lọc
- **When** áp dụng
- **Then** danh sách thỏa đồng thời tất cả tiêu chí

**Notes:** Size: M.

#### [US-10] Xem profile đối tác + lý do match
**Story:** Là **Member**, tôi muốn xem hồ sơ đối tác và lý do được ghép, để **quyết định like/skip dựa trên thông tin minh bạch**.

**Acceptance Criteria:**

AC1 — Mở hồ sơ
- **Given** Member ở danh sách gợi ý
- **When** chọn một đối tác
- **Then** hiển thị hồ sơ đầy đủ (ngôn ngữ + level, sở thích, bio, mục tiêu)

AC2 — Lý do match (why-matched)
- **Given** Member xem hồ sơ một gợi ý
- **When** trang hiển thị
- **Then** nêu rõ cặp ngôn ngữ bù trừ và sở thích chung (trust signal thay cho credit)

**Notes:** Size: S.

#### [US-11] Like (tạo MATCH lazy)
**Story:** Là **Member**, tôi muốn Like một đối tác, để **bày tỏ quan tâm và có thể bắt đầu trò chuyện nếu họ cũng thích tôi**.

**Acceptance Criteria:**

AC1 — Like tạo MATCH
- **Given** Member xem một đối tác chưa tương tác
- **When** chọn Like
- **Then** hệ thống tạo MATCH với status = liked (lazy creation) và ghi INTERACTION like

AC2 — Like dẫn tới mutual
- **Given** đối tác đã Like tôi trước đó
- **When** tôi Like lại
- **Then** MATCH chuyển status = mutual và mở luồng chat (xem US-13)

**Notes:** Size: M. **Tham số (đã chốt):** MATCH status = liked → expired sau 14 ngày nếu không thành mutual.

#### [US-12] Skip
**Story:** Là **Member**, tôi muốn Skip một đối tác, để **không thấy lại người không phù hợp và tập trung vào gợi ý tốt hơn**.

**Acceptance Criteria:**

AC1 — Skip ghi nhận
- **Given** Member xem một đối tác
- **When** chọn Skip
- **Then** hệ thống ghi INTERACTION skip

AC2 — Không hiện lại
- **Given** Member đã Skip một người
- **When** xem lại danh sách gợi ý
- **Then** người đó không xuất hiện lại (trong khoảng thời gian quy định)

**Notes:** Size: S. **Tham số (đã chốt):** Người bị Skip được ẩn 30 ngày, sau đó có thể xuất hiện lại.

#### [US-13] Mutual match → mở chat
**Story:** Là **Member**, tôi muốn được mở cuộc trò chuyện khi cả hai cùng thích nhau, để **bắt đầu luyện ngôn ngữ ngay**.

**Acceptance Criteria:**

AC1 — Tạo hội thoại khi mutual
- **Given** một MATCH chuyển sang status = mutual
- **When** sự kiện mutual xảy ra
- **Then** hệ thống tạo CONVERSATION cho cặp đó và thông báo cho cả hai

AC2 — Truy cập chat
- **Given** đã có CONVERSATION
- **When** Member mở match thành công
- **Then** vào được màn hình chat với đối tác

**Notes:** Size: M. Bàn giao từ Matching surface sang Chat epic.

---

### Epic 4 — 1:1 Text Chat

#### [US-14] Nhắn tin text real-time
**Story:** Là **Member**, tôi muốn gửi và nhận tin nhắn text tức thời, để **luyện hội thoại với đối tác**.

**Acceptance Criteria:**

AC1 — Gửi/nhận real-time
- **Given** hai Member đã mutual và mở chat
- **When** một người gửi tin text
- **Then** người kia nhận được gần như tức thời và tin được lưu vào hội thoại

AC2 — Mất kết nối & khôi phục
- **Given** kết nối realtime bị gián đoạn tạm thời
- **When** kết nối được khôi phục
- **Then** hệ thống tự reconnect và không mất tin đã gửi thành công

AC3 — Chỉ text ở MVP
- **Given** Member trong khung chat
- **When** soạn tin
- **Then** chỉ hỗ trợ text (ảnh/voice/video ngoài phạm vi MVP)

**Notes:** Size: L (rủi ro kỹ thuật realtime — đã spike ở Sprint 0). Dùng giải pháp managed đã chốt.

#### [US-15] Lịch sử trò chuyện (Inbox)
**Story:** Là **Member**, tôi muốn xem danh sách hội thoại đã có và mở lại, để **nói tiếp với người cũ nhanh hơn là tìm trong từng hồ sơ**.

**Acceptance Criteria:**

AC1 — Danh sách hội thoại
- **Given** Member đã có ≥1 hội thoại
- **When** mở Inbox
- **Then** hiển thị danh sách hội thoại sắp theo gần nhất, kèm tin cuối + thời gian

AC2 — Mở lại hội thoại
- **Given** Member ở Inbox
- **When** chọn một hội thoại
- **Then** mở lại đầy đủ lịch sử tin nhắn và có thể nhắn tiếp

AC3 — Đánh dấu chưa đọc *(optional)*
- **Given** có tin mới chưa đọc
- **When** xem Inbox
- **Then** hội thoại đó được đánh dấu chưa đọc

**Notes:** Không phát sinh thực thể mới (CONVERSATION + MESSAGE đã có). Size: M.

#### [US-16] Trạng thái hoạt động (last_active)
**Story:** Là **Member**, tôi muốn thấy ai đang/gần đây hoạt động, để **ưu tiên nhắn người dễ phản hồi (giảm ghosting)**.

**Acceptance Criteria:**

AC1 — Hiển thị trạng thái
- **Given** Member xem hồ sơ hoặc gợi ý
- **When** trang hiển thị
- **Then** thể hiện trạng thái online hoặc thời điểm last_active

AC2 — Ưu tiên người hoạt động
- **Given** nhiều gợi ý cùng mức phù hợp
- **When** xếp hạng
- **Then** người đang/gần đây hoạt động được ưu tiên lên trên

**Notes:** Priority Should* (rẻ, đánh trực diện rủi ro flake ~70%). Size: S.

---

### Epic 5 — Trust

#### [US-17] Report người dùng
**Story:** Là **Member**, tôi muốn report một người vi phạm, để **giữ cộng đồng an toàn**.

**Acceptance Criteria:**

AC1 — Gửi report
- **Given** Member ở hồ sơ hoặc khung chat của một người
- **When** chọn Report và chọn lý do
- **Then** hệ thống ghi nhận report kèm lý do và xác nhận đã gửi

**Notes:** Size: S. Xử lý report = Moderation/Admin (#8, Should — ngoài backlog Must này).

#### [US-18] Block / Unblock
**Story:** Là **Member**, tôi muốn block một người, để **họ không thể liên hệ hoặc nhắn tin cho tôi nữa**.

**Acceptance Criteria:**

AC1 — Block
- **Given** Member ở hồ sơ hoặc chat của một người
- **When** chọn Block
- **Then** người đó bị ẩn/chặn khỏi gợi ý và không gửi tin cho tôi được

AC2 — Người bị block không tương tác được
- **Given** A đã block B
- **When** B cố mở chat hoặc thấy A trong gợi ý
- **Then** B không nhắn được cho A và A không xuất hiện cho B

AC3 — Unblock
- **Given** A đã block B
- **When** A chọn Unblock
- **Then** quan hệ chặn được gỡ

**Notes:** Size: S.

---

### Epic 6 — Admin / Moderation

> Hiện thực hóa actor **Moderator / Admin** và feature **#8 Moderation/Admin** (Should). Cần khái niệm quyền: `USER.role = member | admin`. Admin đăng nhập qua cùng luồng Auth nhưng có quyền nâng cao.

#### [US-19] Admin xem & xử lý report
**Story:** Là **Admin**, tôi muốn xem và xử lý các report, để **quyết định người dùng có dấu hiệu xấu và giữ cộng đồng an toàn**.

**Acceptance Criteria:**

AC1 — Xem danh sách report
- **Given** Admin đã đăng nhập với quyền admin
- **When** mở trang quản lý report
- **Then** thấy danh sách report kèm người bị báo, người báo, lý do, thời gian

AC2 — Ra quyết định & ghi log
- **Given** Admin xem một report
- **When** chọn xử lý (bỏ qua / cảnh cáo / vô hiệu hóa tài khoản)
- **Then** hệ thống thực thi hành động và ghi log kiểm duyệt (ai, làm gì, khi nào)

AC3 — Chặn truy cập trái quyền
- **Given** một Member thường (role = member)
- **When** cố mở trang quản lý report
- **Then** bị từ chối truy cập

**Notes:** Quyền chỉ dành cho role = admin. Size: M.

#### [US-20] Admin vô hiệu hóa (theo mức độ) / xóa cứng khi tái phạm
**Story:** Là **Admin**, tôi muốn vô hiệu hóa tài khoản theo mức độ tăng dần và xóa cứng khi tái phạm, để **xử lý vi phạm tương xứng và ngăn người xấu tiếp tục**.

**Acceptance Criteria:**

AC1 — Vô hiệu hóa có thời hạn (theo mức độ)
- **Given** Admin xem một tài khoản vi phạm
- **When** chọn vô hiệu hóa mức **3 ngày** hoặc **1 tuần**
- **Then** tài khoản bị khóa trong thời hạn đó (không đăng nhập / không hiện gợi ý / không nhắn tin), tự mở lại khi hết hạn

AC2 — Xóa cứng khi tái phạm
- **Given** một tài khoản đã từng bị vô hiệu hóa và tiếp tục vi phạm
- **When** Admin chọn xử lý
- **Then** hệ thống cho phép xóa cứng tài khoản đó

AC3 — Ghi log & thông báo người dùng
- **Given** Admin thực hiện vô hiệu hóa hoặc xóa
- **When** hành động hoàn tất
- **Then** ghi log (ai, mức độ, lý do, thời điểm) và thông báo cho người dùng lý do + thời hạn

**Notes:** Quy tắc leo thang: lần 1 → 3 ngày, lần 2 → 1 tuần, tái phạm tiếp → xóa cứng. Cần lưu **lịch sử vi phạm** để xác định tái phạm. Size: M.
**Quyết định (đã chốt):** Khi xóa cứng, **ẩn danh** dữ liệu liên quan (CONVERSATION/MESSAGE/MATCH) để giữ toàn vẹn hội thoại của người còn lại — không xóa theo.

#### [US-21] Admin quản lý danh mục (taxonomy)
**Story:** Là **Admin**, tôi muốn quản lý danh mục LANGUAGE và TOPIC, để **dữ liệu nền nhất quán cho matching và hồ sơ**.

**Acceptance Criteria:**

AC1 — Quản lý LANGUAGE/TOPIC
- **Given** Admin ở trang quản lý danh mục
- **When** thêm / sửa / ẩn một LANGUAGE hoặc TOPIC
- **Then** thay đổi được áp dụng cho hồ sơ và bộ lọc

**Notes:** Priority Could. Size: S.

---

## 4. Assumptions & Open Questions (cần chốt)

- **(Đã chốt)** Cho dạy ngôn ngữ role = **fluent** (ngoài native) — **có**. role = native | fluent | learning.
- **(Đã chốt)** Admin: thêm `USER.role = member | admin`; vô hiệu hóa **3 ngày / 1 tuần**, **xóa cứng khi tái phạm**; **đưa vào MVP (Sprint 3)**. Cần lưu **lịch sử vi phạm**. Ảnh hưởng Auth, ERD, US-17/US-20.
- **(Đã chốt)** Thang trình độ **1–5** cho learning; fluent dùng CEFR; khung riêng (HSK/JLPT/TOPIK) để Later.
- **(Đã chốt — chuẩn phổ thông)** Mật khẩu ≥8 ký tự (chữ+số); session idle 30 phút; khóa 15 phút sau 5 lần sai; Skip ẩn 30 ngày; MATCH liked → expired sau 14 ngày.
- **Ngoài backlog này (Should/Later) — chi tiết ở mục 1.2:** lập lịch theo múi giờ, dịch in-chat, media trong chat (ảnh/emoji/chụp), **Sổ từ vựng (mới)**, like + reference, correction, verification, "thành viên tích cực tuần", video call. *(Admin đã đưa vào — Epic 6.)*
- **(Đã chốt)** Khôi phục mật khẩu: đã chi tiết hoá → US-22 (Sprint 1).

## 5. Definition of Ready / Definition of Done

Áp dụng theo bản *Kế hoạch triển khai 2 tháng* (Mục 9). Tóm tắt:
- **DoR:** có mô tả + acceptance criteria (Gherkin); đủ nhỏ gọn trong 1 sprint; phụ thuộc rõ; team hiểu & ước tính được.
- **DoD:** code đúng story & thiết kế; pass test case; merge develop qua PR + review; demo và BA xác nhận; không bug blocker.

---

*Tài liệu sống — refine cùng team ở Backlog Refinement; cập nhật khi có quyết định mới từ mentor.*
