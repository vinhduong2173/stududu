---
category: Foundation
---
Ảnh đại diện tròn với fallback chữ cái đầu trên nền gradient primary→secondary. Cỡ `sm`/`md`/`lg`/`xl`. Prop `online` (boolean) hiện chấm trạng thái xanh/xám — bỏ qua thì không có chấm.

```tsx
<Avatar src={user.avatarUrl} fallback={user.displayName.charAt(0)} size="lg" online />
```
