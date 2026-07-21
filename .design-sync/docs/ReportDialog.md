---
category: Trust
---
Dialog báo cáo người dùng/nội dung: radio 5 lý do + ô ghi chú. `targetId` là user bị báo cáo; `targetType`/`targetContentId` tùy chọn để report bài viết hoặc mục thư viện từ. `onDone` gọi sau khi gửi thành công (hiện toast).

```tsx
<ReportDialog open onClose={close} targetId={2} targetName="Sarah Jenkins" onDone={showToast} />
```
