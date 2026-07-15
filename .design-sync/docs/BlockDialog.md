---
category: Trust
---
Dialog xác nhận chặn người dùng — nêu hậu quả (không nhắn tin, không thấy nhau ở Khám phá) và nút Chặn màu error. `onDone` gọi sau khi chặn thành công.

```tsx
<BlockDialog open onClose={close} targetId={2} targetName="Sarah Jenkins" onDone={afterBlock} />
```
