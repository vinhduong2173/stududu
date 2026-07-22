# Coding Convention — stududu

**Version:** 1.1 · cập nhật 22/07/2026 (chi tiết hoá Git workflow sau review với mentor) · Stack: Next.js (FE) + NestJS (BE) + PostgreSQL/Prisma · TypeScript

Mục tiêu: code nhất quán, dễ review, ít bug. Áp dụng từ Sprint 0.

---

## 1. Cấu trúc repository

Một repo, chia thư mục:

```
stududu/
  frontend/      # Next.js (App Router) + Tailwind + shadcn/ui
  backend/       # NestJS + Prisma
  shared/        # type dùng chung FE-BE (optional)
  .gitignore  .editorconfig  README.md
```

**Frontend (Next.js):**
```
frontend/src/
  app/            # routes (App Router)
  components/     # UI tái dùng (Button, Chip, MatchCard…)
  features/       # theo module: auth, profile, matching, chat, trust
  lib/            # api client, hooks, utils
  styles/         # theme.css, globals.css
```

**Backend (NestJS) — theo module khớp Epic:**
```
backend/src/
  modules/
    auth/  user/  language/  matching/  chat/  trust/  admin/
  prisma/         # schema.prisma + migrations
  common/         # guards, interceptors, config
  main.ts
```

## 2. Quy ước đặt tên

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Component React / Class | PascalCase | `MatchCard`, `AuthService` |
| File component | PascalCase.tsx | `MatchCard.tsx` |
| File khác (util/hook) | camelCase / kebab | `useAuth.ts`, `match-score.ts` |
| Biến / hàm | camelCase | `getSuggestions()` |
| Hằng số | UPPER_SNAKE | `MAX_LOGIN_ATTEMPTS` |
| Bảng DB / cột | snake_case | `user_languages`, `last_active` |
| Enum value | theo SRS | `native | fluent | learning` |
| Branch | xem mục 4 | `feature/us-01-dang-ky` |

- TypeScript **strict mode** bật. Không dùng `any` (dùng `unknown` + ép kiểu khi cần).
- Mỗi file một mục đích; component < ~200 dòng thì tách.

## 3. Lint & Format

- **ESLint** (airbnb/next + @typescript-eslint) + **Prettier**. Bật từ Sprint 0; CI chặn nếu lint fail.
- Prettier gợi ý: `printWidth: 100`, `singleQuote: true`, `semi: true`, `trailingComma: all`.
- Format on save; chạy `lint` + `format` trước khi commit (khuyến nghị dùng husky + lint-staged).
- `.env` chứa secret (DATABASE_URL, JWT_SECRET, API key) — **KHÔNG commit**; có `.env.example`.

## 4. Git workflow

### 4.1. Ba loại nhánh — vai trò khác nhau

| Nhánh | Vai trò | Ai commit vào | Vòng đời |
|---|---|---|---|
| `main` | Code đã demo/phát hành được, luôn chạy | **KHÔNG ai commit thẳng.** Chỉ nhận merge từ `develop` sau Sprint Review | Vĩnh viễn |
| `develop` | Nơi tích hợp các feature đã xong trong Sprint | **KHÔNG ai commit thẳng.** Chỉ nhận merge qua PR từ `feature/*` | Vĩnh viễn |
| `feature/<mã>-<mô-tả>` | Một người làm **một** User Story | Người được giao US đó | Ngắn (1–3 ngày), **xoá sau khi merge** |
| `hotfix/<mô-tả>` | Sửa lỗi gấp trên production | Người xử lý | Ngắn, xoá sau khi merge |

> **Nguyên tắc bất biến:** `main` và `develop` là nhánh chỉ-nhận-merge. Mọi thay đổi PHẢI đi qua một nhánh `feature/*` (hoặc `hotfix/*`) và một Pull Request. Điều này được **ép buộc bằng branch protection** trên GitHub (xem mục 6.1), không dựa vào việc "nhớ thì làm".

### 4.2. Quy tắc đặt & tách nhánh

- **1 User Story = 1 nhánh `feature/*` = 1 Pull Request.** Không gộp nhiều US vào một nhánh, không gộp nhiều US vào một PR.
- Tên nhánh bám mã US, chữ thường, gạch ngang, không dấu:
  - `feature/us-01-dang-ky`
  - `feature/us-08-matching-loc-ung-vien`
  - `feature/us-14-chat-realtime`
  - `hotfix/login-lockout`
- **Tách theo lát cắt dọc (vertical slice), KHÔNG theo tầng kỹ thuật.** Mỗi nhánh làm một mẩu chạy end-to-end được (cả BE lẫn FE nếu cần), thay vì một nhánh "chỉ backend" và một nhánh "chỉ frontend". Nếu một US quá to, tách nhỏ vẫn theo lát cắt chạy được:
  - `feature/us-08a-api-goi-y-ung-vien` (BE: endpoint trả danh sách match)
  - `feature/us-08b-ui-danh-sach-match` (FE: render danh sách, gọi API/stub)
- Nhánh sống **tối đa 1–3 ngày rồi merge**. Nhánh sống càng lâu càng lệch xa `develop`, merge càng đau. Nếu một US làm quá 3 ngày → dấu hiệu cần tách nhỏ hơn.

### 4.3. Vòng đời một feature (luồng chuẩn)

```
git checkout develop && git pull          # lấy bản develop mới nhất
git checkout -b feature/us-08-matching     # tách nhánh từ develop
# ... code, commit nhỏ và thường xuyên ...
git push -u origin feature/us-08-matching  # đẩy lên, mở Pull Request vào develop
# ... ≥1 người review (khác người viết) ...
# merge PR vào develop → xoá nhánh feature
```

Sau Sprint Review: Tech Lead merge `develop → main`.
Lỗi gấp: `hotfix/x` tách từ `main` → merge **cả `main` lẫn `develop`** (không để main-develop lệch nhau).

### 4.4. Commit — Conventional Commits

`type(scope): mô tả ngắn`
- type: `feat` `fix` `docs` `refactor` `test` `chore` `style`.
- VD: `feat(auth): thêm đăng ký bằng email`, `fix(chat): reconnect không mất tin`.
- Commit **nhỏ và thường xuyên** trong nhánh feature (mỗi commit là một bước logic hoàn chỉnh), đừng dồn cả ngày vào một commit khổng lồ.

### 4.5. Pull Request

- Tiêu đề rõ + mô tả + **link tới User Story**.
- **Người review khác người viết.**
- Checklist trước khi mở PR: pass lint · pass test · đã tự test tay · không lộ secret · không vi phạm business rule (AGENTS.md mục 3).
- PR nên nhỏ (lý tưởng < ~400 dòng thay đổi) để review được thật, không "duyệt cho có".

### 4.6. Các lỗi thường gặp — tránh ngay

| Lỗi | Vì sao hại | Cách tránh |
|---|---|---|
| Commit thẳng lên `main`/`develop` | Mất điểm review, phá code chung cả team | Bật branch protection (mục 6.1); mọi thay đổi qua PR |
| Nhánh chia theo tầng (`frontend`, `backend`) | BE/FE không gặp nhau đến phút cuối → tích hợp đau | Chia theo feature/US, lát cắt dọc |
| Nhánh sống hàng tuần | Merge conflict dồn cục, khó review | Tách US nhỏ, merge trong 1–3 ngày |
| Tên nhánh mơ hồ (`fix`, `test`, `vinh-lam`) | Không ai biết nhánh làm gì | `feature/us-XX-mo-ta-ngan` bám mã US |
| Một PR gộp nhiều US | Review không nổi; revert là mất cả cụm | 1 US = 1 PR |

## 5. Định nghĩa hoàn thành (DoD) — nhắc lại

Code đúng User Story & thiết kế · pass test case · merge develop qua PR + review · demo và BA xác nhận · không bug blocker.

## 6. Setup nhanh (Tech Lead — Sprint 0)

1. Tạo repo Git, thêm thành viên, **mời mentor**.
2. Bật branch protection cho `main`/`develop` — chi tiết ở mục 6.1.
3. Init `frontend` (Next.js + Tailwind + shadcn) & `backend` (NestJS + Prisma).
4. Thêm ESLint/Prettier + `.env.example` + README (cách chạy dev).
5. Commit base đầu tiên lên `develop`.

### 6.1. Checklist bật Branch Protection trên GitHub

Đây là bước **ép buộc** luồng ở mục 4 — không bật thì quy tắc chỉ nằm trên giấy. Vào **Settings → Branches → Add branch ruleset** (hoặc "Add rule" nếu bản cũ), tạo rule cho `main` và một rule cho `develop`, mỗi rule tick:

- [ ] **Require a pull request before merging** — chặn commit đẩy thẳng lên nhánh.
  - [ ] Require approvals: **1** (tối thiểu 1 review, người khác người viết).
  - [ ] Dismiss stale approvals khi có commit mới (khuyến nghị).
- [ ] **Require status checks to pass before merging** — bật khi đã có CI:
  - [ ] chọn check `lint` và `test` (chặn merge nếu lint/test fail).
  - [ ] Require branches to be up to date before merging.
- [ ] **Do not allow bypassing the above settings** — áp cả cho admin (kể cả Tech Lead cũng phải qua PR).
- [ ] Với `main`: bật thêm **Restrict deletions** và không cho force-push.

Kiểm tra nhanh sau khi bật: thử `git push origin main` trực tiếp → phải bị **từ chối**. Nếu push được nghĩa là rule chưa ăn.

> **Dọn dẹp nhánh cũ:** nhánh `frontend` hiện tại chia theo tầng kỹ thuật — trái quy ước mục 4.2. Sau khi đã hợp nhất phần cần thiết vào `develop`, nên xoá nhánh này để tránh cả team hiểu nhầm mô hình branch.
