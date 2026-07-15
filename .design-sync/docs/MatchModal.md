---
category: Matching
---
Modal mừng "🎉 Đã match!" khi hai bên cùng thích nhau — 2 avatar chạm nhau, nút "Nhắn tin ngay" (mở hội thoại `conversationId`) và "Tiếp tục khám phá". Overlay toàn màn hình (fixed inset-0).

```tsx
<MatchModal isOpen onClose={close} partnerName="Sarah Jenkins" conversationId={12} />
```
