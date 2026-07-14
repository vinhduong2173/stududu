# Prompt cho AI Figma — Thiết kế UI "Web Trao đổi Ngôn ngữ" (MVP)

> **Cách dùng:** Copy toàn bộ phần trong khung "PROMPT" bên dưới dán vào AI tạo UI (Figma Make / First Draft / Visily / Uizard / v0…).
> - Tool tạo **nhiều màn cùng lúc** → dán hết một lần.
> - Tool tạo **từng màn** → dán mục "0–3" (context + design system) trước, rồi dán lần lượt từng "MÀN [x]".
> - Microcopy để **tiếng Việt**; thuật ngữ thiết kế giữ tiếng Anh. Muốn bản tiếng Anh hãy báo mình.

---

## ===== PROMPT (copy từ đây) =====

You are a senior product designer. Design a **high-fidelity, responsive web app UI** for a language-exchange product. Generate **both Desktop (1440px) and Mobile (375px)** frames for every screen, plus one **Design System / Components** page. All visible copy must be in **Vietnamese**. Use realistic Vietnamese sample data (tên người Việt, ảnh avatar đa dạng). Keep it clean, modern, friendly and trustworthy — không trẻ con, không lòe loẹt.

### 0. Bối cảnh sản phẩm
"Web Trao đổi Ngôn ngữ" giúp người học ngoại ngữ tìm **đối tác bù trừ ngôn ngữ** và **chat 1:1** để luyện nói. Nguyên tắc ghép: *tôi dạy bạn tiếng mẹ đẻ của tôi, bạn dạy lại tiếng bạn đang học*. Sở thích chung là bộ lọc phụ. Sản phẩm **minh bạch, không dùng điểm số/credit**. Đối tượng: người học (thường intermediate trở lên). Web-first, responsive.

### 1. Design system (tạo trước, các màn dùng lại)
- **Style:** modern, airy, nhiều whitespace, bo góc mềm (radius 12–16px), shadow nhẹ. Cảm giác education + social, đáng tin.
- **Font:** "Be Vietnam Pro" (hoặc Inter) — hỗ trợ dấu tiếng Việt tốt. Scale: H1 32 / H2 24 / H3 20 / Body 16 / Caption 13.
- **Bảng màu (gợi ý, có thể tinh chỉnh):**
  - Primary (Indigo): `#4F46E5` · Primary-hover `#4338CA`
  - Accent (Teal): `#0EA5A4`
  - Success `#16A34A` · Warning `#F59E0B` · Error `#EF4444`
  - Neutral: text `#0F172A`, muted `#64748B`, border `#E2E8F0`, bg `#F8FAFC`, surface `#FFFFFF`
- **Components cần có (đặt ở trang Design System):**
  - Buttons: Primary / Secondary / Ghost / Icon · trạng thái default, hover, disabled, loading.
  - Inputs: text, password (toggle hiện/ẩn), select/dropdown, search · trạng thái focus, error (kèm helper text đỏ).
  - **Chips/Tags:** ngôn ngữ (kèm cờ + nhãn role), sở thích (chọn được), level badge.
  - **Avatar** với chấm trạng thái online (xanh) / offline.
  - **Card gợi ý đối tác** (component chính — mô tả ở MÀN 6).
  - Badges: level (Mới bắt đầu…Thành thạo), "native", "đang học".
  - Modal/Dialog, Toast (success/error), Tooltip.
  - **Empty state**, **loading skeleton**, **error state** (3 mẫu dùng chung).
  - Top navigation (desktop) + Bottom tab bar (mobile).
- **Thang trình độ (dùng ở Onboarding & Profile):** 1 Mới bắt đầu · 2 Sơ cấp · 3 Trung cấp · 4 Khá · 5 Thành thạo (≈ CEFR A1→C2).

### 2. Khung điều hướng chung
- **Desktop (đã đăng nhập):** top nav — Logo trái; giữa: **Khám phá · Tin nhắn · Hồ sơ**; phải: avatar (menu: Hồ sơ, Cài đặt, Đăng xuất).
- **Mobile:** bottom tab bar 3 icon — **Khám phá · Tin nhắn · Hồ sơ**.
- Khách chưa đăng nhập: header gọn (Logo · Đăng nhập · Đăng ký).

### 3. Danh sách màn hình cần thiết kế
Auth (3) · Onboarding (3) · Khám phá & Ghép đôi (3) · Chat (2) · Hồ sơ của tôi (1) · Trust (2) · Admin (3, ưu tiên thấp). Chi tiết bên dưới.

---

### MÀN 1 — Đăng ký *(US-01)*
- **Mục đích:** Guest tạo tài khoản email + mật khẩu.
- **Bố cục:** card giữa màn (desktop: 2 cột — trái minh hoạ/illustration ngôn ngữ + tagline; phải form). Mobile: form full-width.
- **Thành phần:** Tiêu đề "Tạo tài khoản"; input Email; input Mật khẩu (toggle hiện/ẩn) + helper "Tối thiểu 8 ký tự, gồm chữ và số"; nút Primary "Đăng ký"; divider "hoặc"; (placeholder) "Tiếp tục với Google" (disabled, ghi chú Later); link "Đã có tài khoản? **Đăng nhập**".
- **Tagline trái:** "Luyện nói với người bản xứ thật — bạn dạy tiếng của bạn, họ dạy lại tiếng bạn học."
- **States:** lỗi "Email đã tồn tại" (helper đỏ dưới Email); lỗi mật khẩu yếu; nút loading.

### MÀN 2 — Đăng nhập *(US-02)*
- Form: Email, Mật khẩu (toggle), link "Quên mật khẩu?", nút "Đăng nhập", link "Chưa có tài khoản? **Đăng ký**".
- **States:** lỗi chung "Email hoặc mật khẩu không đúng" (không tiết lộ email tồn tại); cảnh báo khoá tạm "Bạn đã thử sai nhiều lần, vui lòng thử lại sau 15 phút".

### MÀN 3 — Quên / Đặt lại mật khẩu *(US-22)*
- **3a:** nhập Email → nút "Gửi liên kết đặt lại"; thông báo "Nếu email hợp lệ, chúng tôi đã gửi liên kết (sống 30 phút)".
- **3b:** màn đặt mật khẩu mới (2 input: mật khẩu mới + xác nhận) → "Cập nhật mật khẩu". State "Liên kết đã hết hạn" + nút gửi lại.

### MÀN 4 — Onboarding: Khai ngôn ngữ *(US-04)*
- **Mục đích:** khai ngôn ngữ + trình độ; là bước 1/3 (có stepper trên cùng: Ngôn ngữ · Sở thích · Hoàn thiện).
- **Bố cục:** 2 khối: "**Tôi nói (dạy được)**" và "**Tôi muốn học**".
  - Khối "dạy được": thêm ngôn ngữ, chọn role **Mẹ đẻ (native)** hoặc **Thành thạo (fluent)**; fluent chọn level theo CEFR.
  - Khối "muốn học": thêm ngôn ngữ + chọn **level 1–5** bằng segmented control có nhãn (Mới bắt đầu…Thành thạo).
- **Thành phần:** dropdown ngôn ngữ (kèm cờ, tìm kiếm), chip ngôn ngữ đã thêm (có nút xoá), nút "+ Thêm ngôn ngữ".
- **Validation/nudge:** cần ≥1 ngôn ngữ "dạy được" và ≥1 "muốn học" mới cho "Tiếp tục"; nếu thiếu, nút disabled + hint.
- **Dữ liệu mẫu:** Dạy: Tiếng Việt (Mẹ đẻ). Học: English (Trung cấp).

### MÀN 5 — Onboarding: Chọn sở thích *(US-05)*
- Lưới **chip topic** chọn nhiều (Du lịch, Phim, Âm nhạc, Ẩm thực, Công nghệ, Thể thao, Đọc sách, Game, Kinh doanh, Nghệ thuật…). Gợi ý chọn 3–5; có thể **Bỏ qua** (topic là tuỳ chọn). Stepper 2/3.

### MÀN 6 — Onboarding: Hoàn thiện hồ sơ *(US-06, US-07)*
- **Thanh % hoàn thiện hồ sơ** trên cùng (vd 60%) + gợi ý mục còn thiếu.
- Upload **ảnh đại diện**; ô **Bio** kèm gợi ý mẫu ("Mình học tiếng… vì…", "Cuối tuần mình thích…"); chọn **Mục tiêu/intent** (Bạn luyện tập / Thi cử / Du lịch / Giao tiếp casual).
- **Tiêu chí ghép (MATCH_PREFERENCE):** cặp ngôn ngữ ưu tiên, level đối tác mong muốn. Nút "Hoàn tất → Khám phá".

### MÀN 7 — Khám phá / Danh sách gợi ý *(US-08, US-09, US-10) — màn hình quan trọng nhất*
- **Mục đích:** hiển thị đối tác **bù trừ ngôn ngữ**, xếp hạng, có bộ lọc.
- **Bố cục desktop:** sidebar trái = **Bộ lọc** (cặp ngôn ngữ, level, sở thích, "đang hoạt động"); khu giữa = lưới **Card gợi ý** (2–3 cột); có thể có thanh sort "Phù hợp nhất / Hoạt động gần đây".
- **Card gợi ý đối tác (component chính):**
  - Avatar + chấm online; Tên, tuổi, thành phố.
  - Hàng ngôn ngữ: `Nói: 🇻🇳 Tiếng Việt (bản xứ)` · `Học: 🇬🇧 English (B1)` — dạng chip.
  - **Dòng "Vì sao ghép" (why-matched):** "🔄 Bù trừ: Việt ↔ Anh · Chung sở thích: Du lịch, Phim" (đây là trust signal, làm nổi bật).
  - Nhãn hoạt động: "Hoạt động 5 phút trước".
  - Hai nút: **Bỏ qua** (ghost) và **Thích** (primary, icon trái tim).
- **States:** loading = skeleton card; **empty state** "Chưa có đối tác phù hợp — thử nới tiêu chí lọc" + nút "Đặt lại bộ lọc".
- **Mobile:** card full-width, vuốt; bộ lọc trong bottom sheet.

### MÀN 8 — Hồ sơ đối tác *(US-10, US-17, US-18)*
- Ảnh lớn + tên/tuổi/thành phố + trạng thái hoạt động.
- Khối **Ngôn ngữ** (native/fluent + level, learning + level), khối **Sở thích** (chips), **Bio**, **Mục tiêu**.
- Khối **"Vì sao các bạn hợp"** (why-matched, nổi bật).
- Footer hành động: **Bỏ qua** · **Thích**; menu "⋯" (Báo cáo / Chặn).
- *(Sau khi có like + reference — Later — sẽ có khu "References" và nút Like; hiện chưa cần.)*

### MÀN 9 — Modal "Đã match!" *(US-11, US-13)*
- Modal mừng khi mutual: 2 avatar chạm nhau, tiêu đề "🎉 Các bạn đã match!", phụ đề "Bắt đầu trò chuyện và luyện cùng nhau nhé", 2 nút: **Nhắn tin ngay** (primary) · **Tiếp tục khám phá** (ghost).

### MÀN 10 — Inbox / Danh sách hội thoại *(US-15, US-16)*
- Danh sách hội thoại sắp theo **gần nhất**: avatar (chấm online), tên, **tin cuối** + thời gian, badge **chưa đọc** (số).
- Search hội thoại trên cùng. **Empty state:** "Chưa có cuộc trò chuyện nào — vào Khám phá để tìm đối tác".
- Desktop: bố cục 2 cột (list trái + khung chat phải). Mobile: chỉ list, bấm vào mở MÀN 11.

### MÀN 11 — Chat 1:1 *(US-14, US-16)*
- Header: avatar + tên + trạng thái "Đang hoạt động / Hoạt động 10 phút trước"; menu "⋯" (Xem hồ sơ, Báo cáo, Chặn).
- Khung tin nhắn: bong bóng 2 phía (mình phải/primary, đối tác trái/surface), timestamp, trạng thái đã gửi/đã đọc; **chỉ text** (MVP).
- Ô soạn tin dưới cùng + nút Gửi. (Không cần nút đính kèm/voice ở MVP.)
- **States:** đang kết nối lại "Đang kết nối lại…" (banner mảnh); tin đang gửi (mờ).

### MÀN 12 — Hồ sơ của tôi *(US-06)*
- Xem + chỉnh: ảnh, tên, bio, ngôn ngữ (native/fluent/learning + level), sở thích, mục tiêu; **thanh % hoàn thiện** + gợi ý.
- Nút "Chỉnh sửa hồ sơ"; vào Cài đặt (đổi mật khẩu, danh sách đã chặn, Đăng xuất).

### MÀN 13 — Báo cáo & Chặn *(US-17, US-18)*
- **Report dialog:** chọn lý do (radio: Spam/quảng cáo · Quấy rối · Nội dung không phù hợp · Hồ sơ giả · Khác + ô ghi chú) → "Gửi báo cáo" → toast "Đã gửi báo cáo".
- **Block:** dialog xác nhận "Chặn [Tên]? Người này sẽ không liên hệ được với bạn." → toast. **Danh sách đã chặn** trong Cài đặt (có nút Bỏ chặn).

### MÀN 14–16 — Admin *(US-19, US-20, US-21 — ưu tiên thấp, layout riêng /admin, dạng dashboard)*
- **14. Danh sách Report:** bảng (người bị báo, người báo, lý do, thời gian, trạng thái open/reviewed) + nút "Xử lý".
- **15. Chi tiết người dùng + xử lý:** thông tin + lịch sử vi phạm; hành động **Vô hiệu hoá 3 ngày / 1 tuần** hoặc **Xoá tài khoản** (xác nhận 2 bước); ghi lý do.
- **16. Quản lý danh mục:** bảng LANGUAGE & TOPIC (thêm/sửa/ẩn).

### 4. States & nguyên tắc xuyên suốt
- Mọi danh sách có **empty / loading (skeleton) / error**.
- Làm nổi **why-matched** và **trạng thái hoạt động** (chống ghosting) — đây là điểm khác biệt của sản phẩm.
- Form luôn có validation inline + helper text.
- Responsive: desktop dùng nhiều cột; mobile 1 cột + bottom tab + bottom sheet cho filter.

### 5. Ngoài phạm vi (ĐỪNG thêm vào MVP)
Gọi voice/video, dịch trong chat, sửa lỗi (correction), like/reference, lập lịch, thanh toán/Pro, app mobile native, mạng xã hội/feed. (Các tính năng này để Later — không thiết kế.)

### 6. Đầu ra mong muốn
- 1 trang **Design System** (màu, font, components, states).
- Mỗi màn: **frame Desktop 1440 + frame Mobile 375**.
- Dữ liệu mẫu tiếng Việt thực tế, ảnh avatar đa dạng.
- Đặt tên frame rõ ràng theo "MÀN x — …".

## ===== HẾT PROMPT =====

---

### Phụ chú (cho bạn, không dán vào tool)
- **Map màn ↔ SRS:** mỗi MÀN gắn US/FS trong ngoặc → khi mentor/dev hỏi "màn này từ đâu" là truy ngược được PHẦN 3.
- **Thứ tự ưu tiên thiết kế** (bám Sprint): MÀN 1–6 (Sprint 1) → MÀN 7–9 (Sprint 2) → MÀN 10–13 (Sprint 3) → MÀN 14–16 (Admin, cuối).
- Nếu tool yêu cầu prompt tiếng Anh, hoặc bạn muốn tách prompt riêng cho **một màn** (vd chỉ MÀN 7 thật sâu), báo mình tạo bản đó.
