# design-sync notes — stududu

## Re-sync risks (đọc trước khi sync lại)
- **CHƯA từng render-check bằng máy** (user từ chối cài Playwright): mọi card chỉ được verify bằng smoke VM (bundle init + export list) và mắt người. Re-sync sau nếu cài được Playwright thì chạy full validate không có `--no-render-check` một lần.
- `.ds-styles.css` là CSS Tailwind compile TĨNH — đổi màu/token trong `frontend/src/app/globals.css` hoặc thêm class mới trong app thì PHẢI chạy lại cfg.buildCmd trước khi build bundle (palette hiện tại: nền kem #FEF9EF, primary #227C9D, secondary #FE6D73, accent #17C3B2, warning #FFCB77).
- Font woff2 copy tay từ `.next/dev/static/media` vào `.design-sync/fonts/` — nếu đổi font trong layout.tsx thì phải chép lại + viết lại playfair.css.
- MatchCard data trong preview là mock — đổi shape API user.languages thì sửa `.design-sync/previews/MatchCard.tsx` + docs.
- Driver `resync.mjs` không nhận flag `--no-render-check` → fail khi thiếu Playwright; dùng đường vòng: `package-build.mjs` rồi `package-validate.mjs --no-render-check` (đã làm vậy trong lần sync đầu; receipt driver không có).
- Component mới thêm vào `frontend/src/components/**` sẽ tự được phát hiện — nhớ viết `.design-sync/docs/<Tên>.md` (category) + `.design-sync/previews/<Tên>.tsx`, nếu là icon/phần nội bộ thì componentSrcMap null.

- CẢNH BÁO WINDOWS: đừng dùng PowerShell `Get-Content -Raw` (thiếu `-Encoding utf8`) để đọc/ghi lại file UTF-8 tiếng Việt — đã từng làm hỏng toàn bộ dấu trong `.design-sync/docs/` (phải viết lại bằng Write tool). Sửa file tiếng Việt bằng Edit/Write tool, không round-trip qua PowerShell.
- Fork `.design-sync/overrides/source-kit.mjs` (khai báo trong cfg.libOverrides): thêm 'features' vào GENERIC_DIR để nhóm card lấy từ frontmatter `category` của docs thay vì tên thư mục. Category dùng nhãn ASCII (Foundation/Matching/Chat/Trust) vì slug hóa cắt dấu tiếng Việt ("Tin cậy" → "tin-c-y").

- Repo là app Next.js full-stack (frontend/ + backend/), KHÔNG phải package thư viện: không có dist/, converter chạy synth-entry từ `frontend/src/components/` (ui/ + features/).
- CSS: Tailwind v4 — compile bằng `npx -y @tailwindcss/cli -i src/app/globals.css -o .ds-styles.css` (chạy trong frontend/, đã ghi ở cfg.buildCmd). File output gitignored, phải chạy lại trước mỗi lần sync.
- Font Playfair Display do next/font phục vụ trong app (biến `--font-playfair-display` gắn lúc runtime) → bundle phải tự ship: `.design-sync/fonts/playfair.css` khai @font-face + đặt `:root { --font-playfair-display: … }`, woff2 copy từ `frontend/.next/static/media/` (đã build sẵn).
- Loại khỏi bundle (componentSrcMap null):
  - `MatchModal` — gọi useRouter (next/navigation), render ngoài Next runtime là throw.
  - `EndorsementBadges`, `ChatStats` — fetch API khi mount, không có backend thì render null/trống.
- ĐÃ SỬA: `frontend/src/lib/api.ts` đọc `process.env` top-level → thêm typeof-guard (commit trong app). Không revert — bundle browser chết ngay khi nạp nếu bỏ guard.
- ĐÃ SỬA: `next/link` + `next/navigation` init đọc `process.env` → shim qua tsconfig paths: `frontend/tsconfig.design-sync.json` (cfg.tsconfig) map 2 module này sang `.design-sync/shims/next-{link,navigation}.tsx|ts`. Nhờ đó MatchCard (Link→<a>) và MatchModal (useRouter no-op) render được — KHÔNG loại nữa.
- `cfg.entry: "frontend/dist/index.js"` (không tồn tại, cố ý): mẹo để PKG_DIR resolve về `frontend/` (repo tự thân, node_modules/frontend không có) trong khi entry rơi về synth mode.
- Render check bị người dùng từ chối cài Playwright (~200MB) → validate chạy `--no-render-check`; kiểm tra tay bằng `.review.html` + smoke VM (`.design-sync/.cache/smoke-bundle.mjs` — nạp bundle trong sandbox không có `process`, in danh sách export). Chạy lại smoke sau mỗi rebuild.
