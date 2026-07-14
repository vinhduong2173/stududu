# Coding Convention — stududu

**Version:** 1.0 · Sprint 0 · Stack: Next.js (FE) + NestJS (BE) + PostgreSQL/Prisma · TypeScript

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

- **Nhánh:** `main` (phát hành) · `develop` (tích hợp) · `feature/<mã>-<mô-tả>` · `hotfix/<mô-tả>`.
  - VD: `feature/us-08-matching`, `hotfix/login-lockout`.
- feature tách từ `develop` → làm xong → demo → **Pull Request** → ≥1 review → merge vào `develop`.
- Sau Sprint Review: merge `develop` → `main` (Tech Lead gác cổng).
- Lỗi gấp: `hotfix/x` từ `main` → merge cả `main` & `develop`.

**Commit — Conventional Commits:** `type(scope): mô tả ngắn`
- type: `feat` `fix` `docs` `refactor` `test` `chore` `style`.
- VD: `feat(auth): thêm đăng ký bằng email`, `fix(chat): reconnect không mất tin`.

**Pull Request:** tiêu đề rõ + mô tả + link US; checklist: pass lint, pass test, đã tự test, không secret. Người review khác người viết.

## 5. Định nghĩa hoàn thành (DoD) — nhắc lại

Code đúng User Story & thiết kế · pass test case · merge develop qua PR + review · demo và BA xác nhận · không bug blocker.

## 6. Setup nhanh (Tech Lead — Sprint 0)

1. Tạo repo Git, thêm thành viên, **mời mentor**.
2. Bật branch protection cho `main`/`develop` (yêu cầu PR + review).
3. Init `frontend` (Next.js + Tailwind + shadcn) & `backend` (NestJS + Prisma).
4. Thêm ESLint/Prettier + `.env.example` + README (cách chạy dev).
5. Commit base đầu tiên lên `develop`.
