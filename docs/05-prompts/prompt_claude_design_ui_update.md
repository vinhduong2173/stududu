# Prompt cho Claude Design — Rà soát & bổ sung Design System Stududu

*(Paste nguyên phần dưới đường kẻ vào Claude Design)*

---

Bạn đang làm việc trên design system của **Stududu** — web trao đổi ngôn ngữ (mô hình Tandem): người học được ghép với một người bản xứ/thành thạo để dạy lẫn nhau và trò chuyện trực tiếp.

Trước khi vẽ thêm bất kỳ page nào, hãy **audit lại toàn bộ design system hiện có** trong project này và đối chiếu với checklist đầy đủ bên dưới (dựa trên SRS v3.0 — 28 user story, 9 module). Với mỗi mục, liệt kê rõ: **Đã có / Thiếu / Có nhưng thiếu state phụ**. Sau đó mới vẽ bổ sung các page còn thiếu — giữ đúng style, color token, typography, spacing, component đã thiết lập ở các page hiện có, không tạo ngôn ngữ thiết kế mới.

## Checklist page theo module

**1. Account & Auth**
- Đăng ký tài khoản
- Đăng nhập
- Quên mật khẩu / đặt lại mật khẩu
- Quản lý session đang đăng nhập (đăng xuất từ xa)

**2. Language Profile (onboarding)**
- Khai ngôn ngữ đang học + ngôn ngữ có thể dạy, kèm trình độ
- Chọn chủ đề/sở thích (Topic)
- Hoàn thiện hồ sơ (ảnh, bio, gợi ý còn thiếu)
- Đặt tiêu chí ghép (khoảng trình độ mong muốn, ngôn ngữ ưu tiên...)

**3. Discovery & Matching**
- Trang gợi ý (danh sách/thẻ ứng viên bù trừ ngôn ngữ)
- Bộ lọc gợi ý (filter theo topic, trình độ...)
- Trạng thái "chưa đủ đối tác phù hợp" (insufficient_pool) — KHÔNG dùng empty state trắng, phải có thông điệp riêng
- Xem chi tiết hồ sơ đối tác + lý do match (điểm chung: ngôn ngữ, topic, intent)
- Hành động Like / Skip
- Màn hình "Match thành công" (mutual match) → CTA mở chat

**4. 1:1 Text Chat**
- Inbox / danh sách hội thoại (kèm trạng thái hoạt động last_active)
- Màn hình chat: text real-time, reaction emoji (bộ cố định, không custom), bôi đen 1 từ → nút "Lưu từ vựng"
- Trạng thái đang gõ / đã gửi / đã nhận (nếu có)

**5. Trust**
- Report người dùng (form chọn lý do)
- Danh sách Block / Unblock
- Badge Endorsement trên hồ sơ — **dạng "Nhãn · số lượt" (vd: Thân thiện · 5), TUYỆT ĐỐI không vẽ sao/điểm trung bình/xếp hạng số** — đây là nguyên tắc sản phẩm cốt lõi
- Modal/nút "Ghi nhận" endorsement (chọn nhãn: trình độ ngôn ngữ, hiểu biết xã hội, chuyên môn hẹp, thân thiện)
- Hiển thị thống kê "X giờ chat · Y hội thoại" trên hồ sơ

**6. Admin / Moderation**
- Danh sách report & xử lý (Admin)
- Vô hiệu hóa / xóa tài khoản (Admin)
- Quản lý danh mục — ngôn ngữ, topic (Admin)

**7. Vocabulary**
- Trang "Từ đã lưu" của cá nhân (Sổ từ vựng)
- Trang Thư viện từ vựng chung (public, search, sort theo lượt lưu)
- Trạng thái "Cần bổ sung định nghĩa" cho từ chưa có nghĩa

**8. Community**
- Community feed (bài đăng tự sinh: từ vựng được công khai, mốc giờ chat) + nút Like
- Toggle "Chia sẻ hoạt động của tôi" trong Settings

**9. Scheduling**
- Form đề xuất lịch hẹn trong hội thoại
- Danh sách lịch hẹn (pending / accepted / declined / expired) hiển thị theo timezone trình duyệt
- Notification nhắc lịch (in-app)

**Ngoài ra (cross-cutting)**
- Trang Settings chung (đổi ngôn ngữ UI vi/en — chỉ dịch UI chrome, không dịch nội dung user tạo)
- Empty state, loading state, error state cho từng nhóm màn hình chính (đặc biệt Inbox rỗng, Thư viện từ vựng rỗng, Community feed rỗng)
- Responsive: kiểm tra layout desktop và mobile web cho toàn bộ danh sách trên

## Yêu cầu khi vẽ bổ sung

- Tái sử dụng component đã có (button, card, badge, input, modal...) thay vì tạo mới nếu không cần thiết.
- Với các page có nhiều biến thể trạng thái (rỗng, lỗi, loading, đủ dữ liệu), vẽ đủ ít nhất 2 trạng thái quan trọng nhất, không chỉ vẽ happy path.
- Giữ nhất quán: cùng một khái niệm (vd "trình độ ngôn ngữ", "Match", "Endorsement") phải dùng đúng 1 cách hiển thị xuyên suốt toàn bộ design system, không đặt tên/label khác nhau giữa các page.
- Nếu có mục nào trong checklist mà bạn thấy mơ hồ về hành vi/nội dung, hỏi lại thay vì tự suy đoán và vẽ sai.

## Output mong muốn

Trả lời theo 2 bước:
1. Bảng audit: page nào đã có / thiếu / thiếu state, theo đúng cấu trúc checklist ở trên.
2. Sau khi tôi xác nhận danh sách audit, mới tiến hành vẽ các page/state còn thiếu.

---

*(Hết phần paste)*
