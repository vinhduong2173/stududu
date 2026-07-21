---
category: Matching
---
Card gợi ý đối tác — component chủ đạo của trang Khám phá. Hiện avatar + tên/tuổi/thành phố, chip ngôn ngữ Nói/Học, khối "Chung sở thích" (whyMatched), nút Thích (chuyển "Đã thích" khi `liked`). `user.languages` theo shape `{role: 'native'|'fluent'|'learning', level?, language:{name}}`.

```tsx
<MatchCard
  user={{ id: 2, displayName: "Sarah Jenkins", city: "Hồ Chí Minh", dob: "2000-03-14",
    languages: [{ id: 1, role: "native", language: { name: "English" } },
                { id: 2, role: "learning", level: "2", language: { name: "Tiếng Việt" } }] }}
  whyMatched={{ sharedTopics: ["Du lịch"] }}
  liked={false}
  onLike={handleLike}
/>
```
