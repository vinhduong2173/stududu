# stududu — Web Trao đổi Ngôn ngữ

Đồ án OJT · Core Loop MVP: Account & Auth · Language Profile · Discovery & Matching · 1:1 Text Chat · Trust · Admin.

## Tech stack

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript |
| Realtime | Socket.IO |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh) + bcrypt |

## Cấu trúc repo

```
troll/
  AGENTS.md      # quy tắc chuẩn cho mọi AI agent (Claude Code, Antigravity)
  CLAUDE.md      # import AGENTS.md + ghi chú riêng cho Claude Code
  frontend/      # Next.js (App Router) + Tailwind + shadcn/ui
  backend/       # NestJS + Prisma + Socket.IO
  docs/
    01-requirements/   # SRS, vision & scope, product backlog
    02-design/         # ERD, data dictionary, style guide, diagrams
    03-planning/       # roadmap, implementation plan, phân công Sprint
    04-convention/     # coding convention, rule template cho AI agent
    05-prompts/        # prompt log dùng với AI agent
    _archive/          # bản tài liệu cũ đã bị thay thế
  docker-compose.yml
```

## Chạy dev

### 1. Database (PostgreSQL Local)

Đảm bảo bạn đã cài đặt PostgreSQL trên máy và dịch vụ PostgreSQL đang chạy.
Sửa `DATABASE_URL` trong `backend/.env` để khớp với thông tin kết nối PostgreSQL của bạn. Ví dụ:
`DATABASE_URL="postgresql://postgres:vinh123@localhost:5432/stududu?schema=public"`

### 2. Backend (NestJS) — http://localhost:5000 (theo `PORT` trong `backend/.env`)

```bash
cd backend
cp .env.example .env        # rồi chỉnh nếu cần
npm install
npx prisma migrate dev      # tạo bảng theo schema
npx prisma db seed          # seed LANGUAGE + TOPIC
npm run start:dev
```

### 3. Frontend (Next.js) — http://localhost:3000

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Git workflow

- Nhánh: `main` (phát hành) · `develop` (tích hợp) · `feature/<mã>-<mô-tả>` · `hotfix/<mô-tả>`
- Commit theo Conventional Commits: `feat(auth): thêm đăng ký bằng email`
- Mọi PR cần ≥1 review. Chi tiết: [docs/04-convention/coding-convention.md](docs/04-convention/coding-convention.md)

## Tài liệu

- [AGENTS.md](AGENTS.md) — **đọc trước khi code**: business rules, quy ước i18n, Definition of Done, luồng PR
- [SRS đầy đủ](docs/01-requirements/SRS-stududu.docx) — nguồn chuẩn đặc tả chức năng
- [Product Backlog & User Stories](docs/01-requirements/product-backlog-user-stories.md)
- [ERD](docs/02-design/ERD.mermaid) · [Data Dictionary](docs/02-design/data-dictionary.md)
- [UI/UX Style Guide](docs/02-design/ui-ux-style-guide.md)
- [Coding Convention](docs/04-convention/coding-convention.md)
- [Phân công Sprint hiện tại](docs/03-planning/Phan-cong-cong-viec_16-20-07-2026.md)
