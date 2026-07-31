# Đặc tả kỹ thuật Backend: Tính năng Nhóm Cộng đồng (Community Groups)

 Tác giả: AI Assistant  
 Ngày tạo: 31/07/2026  
 Dành cho: Backend Engineer (NestJS + Prisma + PostgreSQL)  
 Trạng thái: Draft / Chờ phản hồi  

---

## 1. Tổng quan (Overview)

Tính năng **Nhóm Cộng đồng (Community Groups / Study Clubs)** cho phép người dùng trên hệ thống Stududu thành lập và tham gia các câu lạc bộ/nhóm học tập theo ngôn ngữ, mục tiêu hoặc chủ đề (ví dụ: *Hội luyện nói Tiếng Anh C1*, *CLB Tiếng Nhật N3*, *Cùng học Tiếng Hàn giao tiếp*).

Tài liệu này cung cấp thiết kế chi tiết về **CSDL (Prisma Schema)**, **Danh sách API Endpoints**, **Logic phân quyền (RBAC)** và **Quy trình xử lý nghiệp vụ** để developer backend có thể triển khai một cách nhất quán.

---

## 2. Thiết kế CSDL (Prisma Schema Updates)

Cần cập nhật các `enum` và `model` mới vào file [`backend/prisma/schema.prisma`](file:///c:/Stududu-web/stududu-main/backend/prisma/schema.prisma).

### 2.1 Enums Mới

```prisma
enum GroupPrivacy {
  public   // Nhóm công khai: Ai cũng có thể xem bài viết và xem danh sách thành viên
  private  // Nhóm riêng tư: Chỉ thành viên mới xem được bài viết và thành viên
}

enum GroupMemberRole {
  owner    // Trưởng nhóm (người tạo nhóm)
  admin    // Quản trị viên nhóm
  member   // Thành viên thường
}

enum GroupMemberStatus {
  active     // Đang hoạt động
  suspended  // Bị chặn khỏi nhóm
}

enum GroupJoinRequestStatus {
  pending   // Đang chờ duyệt
  approved  // Đã chấp nhận
  rejected  // Đã từ chối
}
```

### 2.2 Models Mới

```prisma
// ===== 1. Nhóm (Group) =====
model Group {
  id           Int          @id @default(autoincrement())
  name         String       @db.VarChar(100)
  slug         String       @unique @db.VarChar(120) // Để làm URL thân thiện (/community/groups/tieng-anh-c1)
  description  String?      @db.Text
  avatarUrl    String?      @map("avatar_url")
  coverUrl     String?      @map("cover_url")
  privacy      GroupPrivacy @default(public)
  
  creatorId    Int          @map("creator_id")
  languageId   Int?         @map("language_id") // Ngôn ngữ tập trung (tùy chọn)
  topicId      Int?         @map("topic_id")    // Chủ đề (tùy chọn)

  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  // Relations
  creator      User               @relation("GroupCreator", fields: [creatorId], references: [id])
  language     Language?          @relation(fields: [languageId], references: [id], onDelete: SetNull)
  topic        Topic?             @relation(fields: [topicId], references: [id], onDelete: SetNull)
  members      GroupMember[]
  joinRequests GroupJoinRequest[]
  posts        ActivityPost[]

  @@map("groups")
}

// ===== 2. Thành viên Nhóm (GroupMember) =====
model GroupMember {
  id        Int               @id @default(autoincrement())
  groupId   Int               @map("group_id")
  userId    Int               @map("user_id")
  role      GroupMemberRole   @default(member)
  status    GroupMemberStatus @default(active)
  joinedAt  DateTime          @default(now()) @map("joined_at")

  group     Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([userId])
  @@map("group_members")
}

// ===== 3. Yêu cầu tham gia nhóm riêng tư (GroupJoinRequest) =====
model GroupJoinRequest {
  id          Int                    @id @default(autoincrement())
  groupId     Int                    @map("group_id")
  userId      Int                    @map("user_id")
  status      GroupJoinRequestStatus @default(pending)
  message     String?                @db.VarChar(255) // Lời nhắn gửi admin nhóm
  createdAt   DateTime               @default(now()) @map("created_at")
  reviewedAt  DateTime?              @map("reviewed_at")
  reviewerId  Int?                   @map("reviewer_id")

  group       Group                  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user        User                   @relation("JoinRequestUser", fields: [userId], references: [id], onDelete: Cascade)
  reviewer    User?                  @relation("JoinRequestReviewer", fields: [reviewerId], references: [id], onDelete: SetNull)

  @@unique([groupId, userId, status])
  @@map("group_join_requests")
}
```

### 2.3 Mở rộng Model Hiện có (`ActivityPost` & `User`)

#### Mở rộng `ActivityPost`:
Thêm cột `groupId` để bài viết có thể thuộc về 1 nhóm (nếu `groupId = null`, bài viết thuộc Feed chung).

```prisma
model ActivityPost {
  // ... các field hiện có ...
  groupId   Int?    @map("group_id")
  group     Group?  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  // ...
}
```

#### Mở rộng `User`:
Bổ sung các quan hệ ngược (relations) đến `Group`, `GroupMember`, `GroupJoinRequest`.

---

## 3. Phân quyền & Ma trận Quyền (Permissions Matrix)

| Hành động | Khách / Chưa tham gia | Thành viên (`member`) | QTV Nhóm (`admin`) | Trưởng nhóm (`owner`) |
| :--- | :---: | :---: | :---: | :---: |
| Xem thông tin nhóm public |  |  |  |  |
| Xem thông tin nhóm private | Chỉ xem tên & mô tả |  |  |  |
| Xem bài viết nhóm private | ❌ |  |  |  |
| Đăng bài trong nhóm | ❌ |  |  |  |
| Xóa bài của mình | ❌ |  |  |  |
| Xóa bài của thành viên khác | ❌ | ❌ |  |  |
| Phê duyệt yêu cầu tham gia | ❌ | ❌ |  |  |
| Chỉ định / Hạ cấp `admin` | ❌ | ❌ | ❌ |  |
| Thay đổi cấu hình nhóm (Tên, Ảnh, Quyền riêng tư) | ❌ | ❌ |  |  |
| Chuyển quyền `owner` / Giải thể nhóm | ❌ | ❌ | ❌ |  |

---

## 4. Chi tiết API Endpoints (API Specification)

Tất cả các API yêu cầu Authentication qua `JwtAuthGuard` (trừ danh sách nhóm public nếu muốn mở rộng xem thử). Base URL đề xuất: `/api/v1/groups`.

### 4.1 Quản lý Nhóm

#### 1. Tạo nhóm mới
* **Endpoint:** `POST /api/v1/groups`
* **Body:**
  ```json
  {
    "name": "CLB Tiếng Anh Giao Tiếp C1",
    "description": "Nhóm dành cho các bạn có trình độ Advanced muốn luyện speaking hàng tuần.",
    "privacy": "public", // "public" | "private"
    "languageId": 1,     // optional
    "topicId": 3,        // optional
    "avatarUrl": "https://...",
    "coverUrl": "https://..."
  }
  ```
* **Logic:**
  * Tạo bản ghi `Group`.
  * Tự động sinh `slug` từ `name` (xử lý trùng slug bằng cách thêm suffix ngẫu nhiên/số thứ tự).
  * Tự động thêm `User` tạo nhóm vào `GroupMember` với `role = 'owner'`, `status = 'active'`.

#### 2. Lấy danh sách Nhóm (Discovery / My Groups)
* **Endpoint:** `GET /api/v1/groups`
* **Query Params:**
  * `tab`: `all` (Tất cả nhóm) | `my_groups` (Nhóm tôi đã tham gia) | `created` (Nhóm do tôi quản lý)
  * `search`: Từ khóa tìm kiếm theo tên nhóm
  * `languageId`: Lọc theo ngôn ngữ
  * `page`, `limit`: Phân trang (mặc định page=1, limit=10)
* **Response:** Trả về danh sách nhóm kèm số lượng thành viên (`memberCount`), trạng thái tham gia của user hiện tại (`isMember`, `role`, `hasPendingRequest`).

#### 3. Lấy chi tiết Nhóm
* **Endpoint:** `GET /api/v1/groups/:idOrSlug`
* **Response:** Thông tin chi tiết nhóm, người tạo, ngôn ngữ, chủ đề, số lượng thành viên, và thông tin quyền hạn của người dùng đang gọi API đối với nhóm này (`userContext: { isMember, role, pendingRequest }`).

#### 4. Cập nhật thông tin Nhóm
* **Endpoint:** `PATCH /api/v1/groups/:id`
* **Guard:** Yêu cầu người dùng là `owner` hoặc `admin`.

#### 5. Giải thể Nhóm
* **Endpoint:** `DELETE /api/v1/groups/:id`
* **Guard:** Chỉ dành cho `owner`.

---

### 4.2 Quản lý Thành viên & Tham gia

#### 1. Tham gia / Gửi yêu cầu tham gia
* **Endpoint:** `POST /api/v1/groups/:id/join`
* **Body:** `{ "message": "Cho mình xin vào nhóm học hỏi" }` (message optional)
* **Logic:**
  * Nếu nhóm `public`: Thêm ngay vào `GroupMember` (`status = active`).
  * Nếu nhóm `private`: Thêm bản ghi vào `GroupJoinRequest` (`status = pending`). Gửi `Notification` đến Owner & Admins của nhóm.

#### 2. Rời nhóm
* **Endpoint:** `POST /api/v1/groups/:id/leave`
* **Logic:**
  * Nếu người rời nhóm là `owner`: Yêu cầu phải chuyển quyền `owner` cho một thành viên khác trước khi rời nhóm, hoặc tự động chỉ định `admin` lâu năm nhất. Nếu không còn ai trong nhóm thì giải thể nhóm.

#### 3. Lấy danh sách thành viên
* **Endpoint:** `GET /api/v1/groups/:id/members`
* **Query:** `role`, `search`, `page`, `limit`
* **Guard:** Nếu nhóm `private`, chỉ cho phép `active member` gọi endpoint này.

#### 4. Quản lý vai trò / Xóa thành viên
* **Endpoint:** `PATCH /api/v1/groups/:id/members/:userId`
* **Body:** `{ "role": "admin" }` hoặc `{ "action": "kick" }`
* **Guard:** Kiểm tra ma trận phân quyền (Admin không thể kick Owner hay Admin khác).

#### 5. Lấy danh sách Yêu cầu tham gia (Pending Requests)
* **Endpoint:** `GET /api/v1/groups/:id/requests`
* **Guard:** Dành cho `owner` / `admin`.

#### 6. Duyệt / Từ chối Yêu cầu tham gia
* **Endpoint:** `PATCH /api/v1/groups/:id/requests/:requestId`
* **Body:** `{ "action": "approve" }` hoặc `{ "action": "reject" }`
* **Logic:** Nếu `approve`, chuyển `GroupJoinRequest` -> `approved`, tạo `GroupMember` mới (`status = active`), gửi thông báo tới người xin gia nhập.

---

### 4.3 Bài viết trong Nhóm (Group Feed)

#### 1. Lấy Bài viết của Nhóm
* **Endpoint:** `GET /api/v1/groups/:id/posts`
* **Query:** `page`, `limit`
* **Guard:** Nếu nhóm `private`, chỉ cho phép `active member` truy cập.

#### 2. Đăng bài vào Nhóm
* **Endpoint:** `POST /api/v1/groups/:id/posts`
* **Body:** Các trường giống bài đăng `ActivityPost` thông thường (`content`, `imageUrl`, `type = 'user_post'`).
* **Logic:** Tạo `ActivityPost` với `groupId = params.id`.

---

## 5. Các loại Thông báo In-App (Notifications)

Mở rộng `enum` / string `type` của model [`Notification`](file:///c:/Stududu-web/stududu-main/backend/prisma/schema.prisma#L515-L530):
1. `group_join_request`: Nhắc Admin khi có người xin gia nhập nhóm private.
2. `group_request_approved`: Thông báo cho user khi yêu cầu xin vào nhóm được chấp nhận.
3. `group_role_updated`: Thông báo khi user được thăng chức thành `admin`.
4. `group_new_post`: (Tùy chọn) Thông báo cho thành viên khi có bài viết mới nổi bật trong nhóm.

---

## 6. Đề xuất Module NestJS Structure

Cấu trúc thư mục đề xuất cho `backend/src/groups`:

```text
src/groups/
├── dto/
│   ├── create-group.dto.ts
│   ├── update-group.dto.ts
│   ├── join-group.dto.ts
│   ├── query-group.dto.ts
│   └── review-request.dto.ts
├── guards/
│   ├── group-member.guard.ts     # Kiểm tra user có trong nhóm hay không
│   └── group-admin.guard.ts      # Kiểm tra user có phải Admin/Owner hay không
├── groups.controller.ts
├── groups.service.ts
└── groups.module.ts
```

---

## 7. Các điểm lưu ý khi triển khai (Backend Notes)

1. **Hiệu năng Query (Indexes):** Đảm bảo đánh index cho `(group_id, user_id)` trong `group_members` và `group_id` trong `activity_posts` để việc load Feed nhóm và kiểm tra membership đạt tốc độ nhanh nhất.
2. **Slug uniqueness:** Dùng thư viện slugify (hoặc custom helper) loại bỏ tiếng Việt có dấu và ký tự đặc biệt khi sinh `slug` từ tên nhóm.
3. **Cascading Delete:** Cấu hình `@relation(..., onDelete: Cascade)` cẩn thận để khi giải thể nhóm, tất cả bài viết, thành viên và yêu cầu liên quan tự động được dọn dẹp sạch sẽ trong DB.
