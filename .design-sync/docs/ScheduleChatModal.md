---
category: Chat
---
Modal hẹn giờ trò chuyện: chọn ngày + giờ cụ thể (giờ của người mời, gửi lên server dạng UTC), kèm khối gợi ý khung giờ rảnh của đối tác đã quy đổi múi giờ. `partnerSlotIds` là id khung giờ (s1..s6), `myOffset`/`partnerOffset` là UTC offset.

```tsx
<ScheduleChatModal open onClose={close} partnerName="Sarah" partnerFlag="🇬🇧"
  partnerOffset={0} myOffset={7} partnerSlotIds={["s3", "s5"]} onSchedule={sendInvite} />
```
