# UI/UX Style Guide — stududu

**Version:** 1.0 · Sprint 0 · Đi kèm `Figma-Make_Theme-Vibrant.css`

Tài liệu thống nhất giao diện để Design & Dev làm việc nhất quán. Tinh thần: **hiện đại, rực rỡ, vui mắt, đáng tin** — app học ngôn ngữ + kết bạn cho người trẻ.

---

## 1. Màu sắc (3 màu chủ đạo)

| Vai trò | Tên | Hex | Dùng cho |
|---|---|---|---|
| Primary | Violet | `#7C3AED` | Nav, nút chính, heading nhấn |
| Secondary | Coral | `#FF4D6D` | Nút "Thích", highlight, "vì sao ghép" |
| Accent | Lime | `#BEF264` | Badge, active, thành công, viền, icon |
| Nền | — | `#FAFAFB` | Background |
| Surface | — | `#FFFFFF` | Card, modal |
| Text | — | `#1A1523` | Chữ chính |
| Muted text | — | `#64748B` | Chữ phụ |
| Border | — | `#E7E5EA` | Viền, input |
| Success / Warning / Error | — | `#16A34A` / `#F59E0B` / `#E11D48` | Trạng thái |

**Quy tắc 60/30/10:** 60% nền + chữ trung tính · 30% violet · 10% coral + lime.
**Gradient thương hiệu:** `linear-gradient(135deg, #7C3AED, #FF4D6D)` cho hero & logo.

> Token màu đặt ở `theme.css`/`globals.css` (xem file `Figma-Make_Theme-Vibrant.css`). KHÔNG hardcode màu rải rác.

## 2. Typography

- Font: **Be Vietnam Pro** (hỗ trợ dấu tiếng Việt) — dự phòng: Inter / Plus Jakarta Sans.
- Thang: H1 32 · H2 24 · H3 20 · Body 16 · Caption 13 (đậm cho heading).
- Tiêu đề chính có thể dùng **chữ gradient** (violet→coral).

## 3. Khoảng cách, bo góc, đổ bóng

- Spacing dùng bội số 4px (4/8/12/16/24/32).
- Bo góc: input/nút 12px · card/modal 16–20px (rounded-2xl) · avatar tròn.
- Shadow: mềm, nhiều lớp — `0 1px 2px rgba(16,12,30,.06), 0 8px 24px rgba(124,58,237,.10)`. Hover card nhấc nhẹ lên.

## 4. Components

- **Button:** Primary (pill, nền violet, chữ trắng) · Secondary/Like (nền coral + icon tim) · Ghost (viền). States: default/hover (đậm + scale nhẹ)/disabled/loading.
- **Input:** bo 12px, focus ring violet, error helper text đỏ.
- **Chip ngôn ngữ:** nền nhạt màu thương hiệu + cờ; **Badge level:** lime.
- **Avatar:** vòng gradient violet→coral + chấm online xanh lá.
- **MatchCard:** nền trắng bo 2xl, avatar lớn, 2 chip Nói/Học, pill "🔄 Vì sao ghép" nền lime nhạt, dòng last_active, 2 nút Bỏ qua + Thích. (xem `MatchCard-vibrant.tsx`)
- **Modal / Toast / Tooltip:** bo mềm, shadow.
- **Bắt buộc cho mọi danh sách:** Empty state (illustration/emoji + CTA), Loading skeleton, Error state.

## 5. Iconography

- Bộ icon line **lucide** (đồng bộ với shadcn). Kích thước 16–20px.

## 6. Accessibility

- Contrast đạt **AA** (chữ thường ≥ 4.5:1).
- Mọi input có label; có focus ring rõ.
- Trạng thái không chỉ dựa vào màu (kèm icon/chữ).

## 7. Do & Don't

- ✅ Giữ card trắng + điểm nhấn màu; dùng gradient cho hero.
- ✅ Làm nổi **why-matched** và **trạng thái hoạt động** (điểm khác biệt sản phẩm).
- ❌ KHÔNG lấy **lime** làm nền cho chữ (quá chói) — chỉ dùng badge/viền/icon.
- ❌ KHÔNG phủ màu mọi bề mặt; tránh > 3 màu nổi trong một khối.
- ❌ KHÔNG hardcode màu/spacing — dùng token.
