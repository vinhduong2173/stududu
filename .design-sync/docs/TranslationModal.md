---
category: Chat
---
Bảng dịch 2 cột (nguồn ↔ đích) với chọn ngôn ngữ, nút hoán đổi và Ctrl+Enter để dịch nhanh. Gọi API `/translate` của backend khi bấm Dịch. `initialText` prefill từ tin nhắn đang chọn.

```tsx
<TranslationModal open onClose={close} initialText="How are you today?" />
```
