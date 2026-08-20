# ==========================================
# Stage 1: Builder stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Cài đặt openssl cho Prisma engine trên Linux Alpine
RUN apk add --no-cache openssl

# Copy package manifests & prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt tất cả dependencies (bao gồm devDependencies để build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy toàn bộ source code & build dự án NestJS
COPY . .
RUN npm run build

# Loại bỏ devDependencies để giảm dung lượng
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner stage
# ==========================================
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Cài đặt openssl cho Prisma runtime
RUN apk add --no-cache openssl

# Copy file từ giai đoạn build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Khai báo port ứng dụng
EXPOSE 3001

# Khởi chạy trực tiếp server NestJS (Không chạy migration DB)
CMD ["node", "dist/main.js"]
