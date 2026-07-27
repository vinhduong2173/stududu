# Rule cho Antigravity — copy vào ~/.gemini/GEMINI.md

Antigravity không tự đọc `AGENTS.md`/`CLAUDE.md` trong repo (tính đến các bản trước 05/03/2026). Mỗi bạn dùng Antigravity cần copy đoạn dưới đây vào file **global** `~/.gemini/GEMINI.md` trên máy mình (file này KHÔNG nằm trong repo, không commit — làm 1 lần là xong cho mọi project).

Nếu Antigravity của bạn đang ở bản mới hơn 05/03/2026, kiểm tra trước xem nó đã tự đọc AGENTS.md chưa — nếu có rồi thì bỏ qua bước này.

---

```
- Luôn kiểm tra và đọc file AGENTS.md ở root của project workspace đang mở, áp dụng toàn bộ quy tắc trong đó trước khi code.
- Có thể có thêm AGENTS.md ở sub-folder với quy tắc riêng cho phần đó của code — ưu tiên áp dụng quy tắc cụ thể hơn nếu có xung đột.
- Nếu AGENTS.md không tồn tại trong project, báo cho user biết trước khi tiếp tục.
```

---

**Cách thêm:**
1. Mở file `~/.gemini/GEMINI.md` (tạo mới nếu chưa có).
2. Dán đoạn rule ở trên vào cuối file.
3. Mở lại Antigravity (hoặc reload workspace) để rule có hiệu lực.

Sau bước này, Antigravity sẽ tự đọc `AGENTS.md` của repo Stududu mỗi khi bạn mở project — cùng một bộ quy tắc mà Claude Code đang dùng qua `CLAUDE.md`.
