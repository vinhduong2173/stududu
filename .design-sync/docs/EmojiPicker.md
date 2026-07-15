---
category: Chat
---
Bảng chọn emoji 3 tab (mặt cười, trái tim, cử chỉ) cho ô soạn tin nhắn. Gọi `onSelect(emoji)` khi chọn; component tự quản lý tab đang mở.

```tsx
<EmojiPicker onSelect={(emoji) => setDraft((d) => d + emoji)} />
```
