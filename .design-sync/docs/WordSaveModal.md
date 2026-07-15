---
category: Chat
---
Modal lưu từ vào Sổ từ vựng: chọn ngôn ngữ (tải từ API `/languages`), từ/cụm từ (prefill qua `initialWord` — thường là chữ bôi đen trong chat), ghi chú riêng. `source` là `"chat"` hoặc `"manual"`. Trong preview tĩnh, danh sách ngôn ngữ trống vì không có backend.

```tsx
<WordSaveModal open onClose={close} initialWord="serendipity" source="chat" onSaved={showToast} />
```
