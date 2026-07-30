# Tài Liệu Yêu Cầu Backend — Đồng Bộ Tính Năng User Profile & Bài Viết Cá Nhân

Tài liệu này tổng hợp các thay đổi và API mới cần triển khai ở phía **Backend (NestJS + Prisma)** để đồng bộ hoàn toàn với giao diện **User Profile & Bài viết cá nhân** ở phía Frontend.

---

## 1. Database Schema (`backend/prisma/schema.prisma`)

### Cập nhật Model `ActivityPost`
Thêm trường `imageUrl` (tùy chọn) để lưu trữ link ảnh đính kèm bài viết.

```prisma
model ActivityPost {
  id         Int       @id @default(autoincrement())
  userId     Int
  type       String    // 'user_post', 'word_public', 'chat_hours_milestone'...
  contentRef String?
  content    String?
  imageUrl   String?   // <--- THÊM MỚI TRƯỜNG NÀY
  createdAt  DateTime  @default(now())

  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes      ActivityLike[]

  @@map("activity_posts")
}
```

> **Lưu ý:** Sau khi sửa `schema.prisma`, chạy `npx prisma migrate dev` hoặc `npx prisma db push` để cập nhật cơ sở dữ liệu.

---

## 2. User Module (`backend/src/modules/user`)

### 2.1. Cập nhật `UpdateProfileDto` (`dto/update-profile.dto.ts`)
Hỗ trợ cả định dạng tiếng Anh lẫn tiếng Việt cho trường `gender`:

```typescript
import { IsIn, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  // ... các trường khác

  @IsOptional()
  @IsIn(['male', 'female', 'other', 'nam', 'nữ', 'khác', ''], { 
    message: 'Giới tính không hợp lệ' 
  })
  gender?: string;
}
```

### 2.2. Chuẩn hóa dữ liệu trong `UserService` (`user.service.ts`)
Khi nhận request cập nhật profile, chuẩn hóa chuỗi `gender` về dạng tiếng Anh chuẩn (`male`, `female`, `other`):

```typescript
updateProfile(userId: number, dto: UpdateProfileDto) {
  const { dob, gender, ...rest } = dto;
  
  let normGender = gender;
  if (gender) {
    const g = gender.toLowerCase().trim();
    normGender = g === 'nam' ? 'male' : g === 'nữ' ? 'female' : g === 'khác' ? 'other' : gender;
  }

  return this.prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(gender !== undefined ? { gender: normGender } : {}),
      ...(dob !== undefined ? { dob: dob ? new Date(dob) : null } : {}),
    },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      gender: true,
      nativeLang: true,
      targetLang: true,
      dob: true,
      timezone: true,
      availableSlots: true,
      interests: { select: { id: true, topic: true } },
    },
  });
}
```

---

## 3. Community Module (`backend/src/modules/community`)

### 3.1. Filter bài viết theo User ID trên Feed (`GET /api/v1/community/feed`)
Thêm `Query('userId')` để phục vụ việc lấy danh sách bài viết riêng của một người dùng trên trang Profile.

* **Method:** `GET`
* **Endpoint:** `/api/v1/community/feed?userId=:userId`
* **Headers:** `Authorization: Bearer <token>` (tùy chọn)

**Xử lý trong `CommunityService.feed()`:**
```typescript
async feed(viewerId?: number, targetUserId?: number) {
  const posts = await this.prisma.activityPost.findMany({
    where: targetUserId && !isNaN(targetUserId) ? { userId: targetUserId } : {},
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
      likes: viewerId ? { where: { userId: viewerId } } : false,
    },
    orderBy: { createdAt: 'desc' },
  });

  return posts.map((p) => ({
    id: p.id,
    type: p.type,
    contentRef: p.contentRef,
    content: p.content,
    imageUrl: p.imageUrl, // <--- Trả về link ảnh bài viết
    createdAt: p.createdAt,
    user: p.user,
    likeCount: p._count.likes,
    likedByMe: viewerId ? (p.likes?.length ?? 0) > 0 : false,
  }));
}
```

---

### 3.2. Tạo bài viết kèm ảnh (`POST /api/v1/community/posts`)
Cập nhật `CreatePostDto` để chấp nhận bài viết có ảnh hoặc chỉ có ảnh/chỉ có nội dung:

```typescript
export class CreatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bài viết tối đa 500 ký tự' })
  content?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
```

**Xử lý trong `CommunityService.createPost()`:**
```typescript
createPost(userId: number, content: string, imageUrl?: string) {
  return this.prisma.activityPost.create({
    data: { 
      userId, 
      type: 'user_post', 
      content: content ? content.trim() : '', 
      imageUrl: imageUrl || null 
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  });
}
```

---

### 3.3. Chỉnh sửa bài viết (`PATCH /api/v1/community/posts/:id`)
Cho phép người dùng chỉnh sửa nội dung bài viết hoặc cập nhật/xóa hình ảnh bài viết của họ.

* **Method:** `PATCH`
* **Endpoint:** `/api/v1/community/posts/:id`
* **Guards:** `@UseGuards(JwtAuthGuard)`

**DTO `UpdatePostDto`:**
```typescript
export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bài viết tối đa 500 ký tự' })
  content?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  removeImage?: boolean;
}
```

**Xử lý trong `CommunityService.updatePost()`:**
```typescript
async updatePost(
  userId: number,
  postId: number,
  dto: UpdatePostDto,
) {
  const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundException('Bài viết không tồn tại');
  if (post.userId !== userId) throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết này');

  const data: any = {};
  if (dto.content !== undefined) data.content = dto.content.trim();
  if (dto.removeImage) {
    data.imageUrl = null;
  } else if (dto.imageUrl !== undefined) {
    data.imageUrl = dto.imageUrl;
  }

  return this.prisma.activityPost.update({
    where: { id: postId },
    data,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  });
}
```

---

### 3.4. Xóa bài viết (`DELETE /api/v1/community/posts/:id`)
Cho phép người dùng xóa bài viết chính chủ.

* **Method:** `DELETE`
* **Endpoint:** `/api/v1/community/posts/:id`
* **Guards:** `@UseGuards(JwtAuthGuard)`

**Xử lý trong `CommunityService.deletePost()`:**
```typescript
async deletePost(userId: number, postId: number) {
  const post = await this.prisma.activityPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundException('Bài viết không tồn tại');
  if (post.userId !== userId) throw new ForbiddenException('Bạn không có quyền xóa bài viết này');

  await this.prisma.activityPost.delete({ where: { id: postId } });
  return { success: true };
}
```

---

## 4. Tóm Tắt Danh Sách Endpoint Cần Kiểm Tra

| Method | Endpoint | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/community/feed?userId=:id` | Optional | Lấy danh sách bài viết (kèm filter theo user) |
| `POST` | `/api/v1/community/posts` | Bearer Token | Tạo bài viết mới (hỗ trợ `imageUrl`) |
| `PATCH` | `/api/v1/community/posts/:id` | Bearer Token | Cập nhật bài viết (sửa nội dung / đổi / xóa ảnh) |
| `DELETE` | `/api/v1/community/posts/:id` | Bearer Token | Xóa bài viết cá nhân |
| `PATCH` | `/api/v1/user/profile` | Bearer Token | Cập nhật profile (đã chuẩn hóa `gender`) |
