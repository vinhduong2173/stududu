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
  frontend/      # Next.js (App Router) + Tailwind + shadcn/ui
  backend/       # NestJS + Prisma + Socket.IO
  docs/          # tài liệu requirements / design / planning
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

- [Product Backlog & User Stories](docs/01-requirements/product-backlog-user-stories.md)
- [ERD](docs/02-design/ERD.mermaid) · [Data Dictionary](docs/02-design/data-dictionary.md)
- [UI/UX Style Guide](docs/02-design/ui-ux-style-guide.md)
- [Coding Convention](docs/04-convention/coding-convention.md)
