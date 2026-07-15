# stududu — quy ước sử dụng design system

**Ngôn ngữ sản phẩm: tiếng Việt.** Mọi microcopy (nút, nhãn, placeholder, thông báo) viết tiếng Việt; giữ thuật ngữ kỹ thuật tiếng Anh khi cần. Font mặc định là **Playfair Display** (serif, đã ship kèm — áp qua `--font-sans`, không cần setup gì).

## Không cần Provider
Component dùng trực tiếp, không có ThemeProvider/Context bắt buộc. Token màu + font sống trong `styles.css` (`:root` custom properties) — chỉ cần stylesheet đã nạp.

## Idiom styling: Tailwind utilities với token ngữ nghĩa
Layout glue viết bằng class Tailwind, màu LUÔN qua token ngữ nghĩa của hệ (đừng dùng màu thô kiểu `bg-purple-600`):

| Vai trò | Class |
|---|---|
| Nền trang (kem #FEF9EF) / bề mặt card (trắng) | `bg-background` / `bg-surface` |
| Chữ chính / phụ | `text-foreground` / `text-muted` |
| Viền | `border-border` |
| Primary (xanh biển #227C9D) | `bg-primary`, `text-primary`, hover `bg-primary-hover` |
| Secondary (coral #FE6D73) | `bg-secondary`, `text-secondary` |
| Accent (turquoise #17C3B2) · Warning (vàng #FFCB77) | `bg-accent` / `text-warning`… |
| Trạng thái | `text-success` / `text-warning` / `text-error` (+ dạng `bg-*` tương ứng) |

Hình khối của hệ: card bo `rounded-2xl`/`rounded-3xl` + `border border-border` + `shadow-sm`; nút/ô nhập bo `rounded-xl`, cao `h-12`; chip bo `rounded-full`. Độ mờ kiểu `bg-primary/10` dùng cho nền nhấn nhẹ.

**Giới hạn quan trọng:** CSS ship kèm là bản compile tĩnh — chỉ những utility class app đã dùng mới tồn tại. Các class trong bảng trên + những gì thấy trong `.prompt.md`/preview là an toàn; một class lạ không có hiệu lực thì thay bằng inline `style={{…}}` cho layout tùy biến (grid đặc biệt, kích thước lẻ).

## Nguồn sự thật
- `styles.css` → import `tokens/`, `fonts/fonts.css`, `_ds_bundle.css` (toàn bộ utility + token thật — đọc file này trước khi tự chế class).
- `components/<nhóm>/<Tên>/<Tên>.prompt.md` — cách dùng từng component kèm ví dụ; `.d.ts` là hợp đồng props.
- Component gọi API nội bộ (WordSaveModal tải `/languages`, EndorseModal tải nhãn đã ghi nhận) render được không cần backend — phần dữ liệu động chỉ trống.

## Mẫu dựng chuẩn
```tsx
<div className="max-w-md mx-auto p-6 bg-surface rounded-3xl border border-border shadow-sm">
  <div className="flex items-center gap-4 mb-4">
    <Avatar fallback="S" size="lg" online />
    <div>
      <h3 className="font-bold text-lg text-foreground">Sarah Jenkins</h3>
      <p className="text-sm text-muted">Đang hoạt động</p>
    </div>
  </div>
  <div className="flex flex-wrap gap-2 mb-6">
    <Chip>English (Mẹ đẻ)</Chip>
    <Chip variant="secondary">Tiếng Việt (Lvl 2)</Chip>
  </div>
  <Button className="w-full">Thích</Button>
</div>
```
