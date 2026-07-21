---
category: Foundation
---
Nút hành động chính của stududu. 4 biến thể: `default` (primary tím), `secondary` (teal), `ghost` (viền), `link`; 4 cỡ: `sm`, `default`, `lg`, `icon`. Nhận mọi props của `<button>`; `asChild` để bọc `<a>`/Link.

```tsx
<Button size="lg">Đăng ký</Button>
<Button variant="secondary"><Heart className="w-4 h-4 mr-2" /> Thích</Button>
<Button variant="ghost" disabled>Đang xử lý...</Button>
```
