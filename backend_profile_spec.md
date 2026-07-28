# Tài liệu Yêu cầu & Thiết kế API Backend cho Chức năng Hồ sơ Người Dùng (Profile Spec)

Tài liệu này tổng hợp chi tiết các yêu cầu về Cơ sở dữ liệu (Database Schema), API RESTful và các logic xử lý nghiệp vụ liên quan đến **Hồ sơ cá nhân (Profile), Tiêu chí ghép đôi, Bài viết trên Hồ sơ và Thống kê luyện tập** để chuyển cho lập trình viên Backend.

---

## 1. Tổng quan các Chức năng thuộc Profile

1. **Xem & Cập nhật Hồ sơ cá nhân (My Profile & Edit Profile):**
   - Đọc và chỉnh sửa thông tin cơ bản: Tên hiển thị, Ảnh đại diện (`avatarUrl`), Giới thiệu (`bio`), Mục tiêu luyện tập (`intent`), Ngày sinh (`dob`), Giới tính (`gender`), Thành phố (`city`).
   - Cài đặt Múi giờ (`timezone`) và Khung giờ rảnh (`availableSlots`).
   - Quản lý Ngôn ngữ dạy được (`native`/`fluent`) và Ngôn ngữ muốn học (`learning` + `level`).
   - Quản lý Chủ đề / Sở thích (`interests`).
   - Quản lý Tiêu chí ghép đôi mong muốn (`matchPreference`: `languageFocus`, `levelDesired`).

2. **Xem Hồ sơ Thành viên khác (Public Partner Profile):**
   - Trả về thông tin công khai của người dùng theo `userId`.
   - Trả về trạng thái quan hệ ghép đôi giữa người xem và đối tác (`liked`, `conversationId`).

3. **Danh sách Bài viết trên Hồ sơ (User Posts on Profile):**
   - Lấy danh sách các bài đăng (bài viết tự do, từ vựng đã đóng góp vào thư viện chung, mốc giờ luyện tập) do chính người dùng đó đăng.

4. **Thống kê luyện tập (Practice Activity Stats):**
   - Tính tổng số giờ luyện tập thực tế và tổng số cuộc trò chuyện (hội thoại) của người dùng.

---

## 2. Thiết kế Database Schema (Prisma)

Đảm bảo file `schema.prisma` có đủ các Model và quan hệ sau:

```prisma
// 1. Model User (Thành viên)
model User {
  id             Int             @id @default(autoincrement())
  email          String          @unique
  passwordHash   String          @map("password_hash")
  displayName    String          @map("display_name")
  avatarUrl      String?         @map("avatar_url")
  bio            String?         @db.Text
  intent         String?         // VD: "Giao tiếp casual", "Thi cử", "Du lịch", "Làm việc"
  dob            DateTime?       @db.Date
  gender         String?         // VD: "Nam", "Nữ", "Khác", "Không tiết lộ"
  city           String?
  timezone       String?         @default("VN") // Múi giờ (VD: "VN", "JP", "US_PST"...)
  availableSlots String[]        @map("available_slots") // Các slot rảnh (VD: ["morn_246", "eve_daily"])
  lastActive     DateTime?       @map("last_active")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  languages      UserLanguage[]
  interests      UserInterest[]
  matchPref      MatchPreference?
  posts          ActivityPost[]
  likes          PostLike[]

  @@map("users")
}

// 2. Model UserLanguage (Ngôn ngữ của người dùng)
model UserLanguage {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  languageId Int      @map("language_id")
  role       String   // "native" | "fluent" | "learning"
  level      String?  // Trình độ khi learning: "1" | "2" | "3" | "4" | "5"

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  language   Language @relation(fields: [languageId], references: [id])

  @@unique([userId, languageId, role])
  @@map("user_languages")
}

// 3. Model UserInterest (Sở thích/Chủ đề của người dùng)
model UserInterest {
  id      Int   @id @default(autoincrement())
  userId  Int   @map("user_id")
  topicId Int   @map("topic_id")

  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic   Topic @relation(fields: [topicId], references: [id])

  @@unique([userId, topicId])
  @@map("user_interests")
}

// 4. Model MatchPreference (Tiêu chí ghép đôi mong muốn)
model MatchPreference {
  id            Int     @id @default(autoincrement())
  userId        Int     @unique @map("user_id")
  languageFocus String? @map("language_focus") // Ngôn ngữ ưu tiên
  levelDesired  String? @map("level_desired")  // Trình độ đối tác mong muốn

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("match_preferences")
}
```

---

## 3. Danh sách Endpoints RESTful API

### 3.1. Lấy thông tin Hồ sơ cá nhân người dùng hiện tại
- **HTTP Method:** `GET`
- **Path:** `/users/me`
- **Auth:** Require `Bearer Token`
- **Response (200 OK):**
```json
{
  "id": 1,
  "email": "vietanh@gmail.com",
  "displayName": "Viet Anh",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Mình đang luyện học tiếng Nhật...",
  "intent": "Làm việc",
  "dob": "1998-05-15",
  "gender": "Nam",
  "city": "Hà Nội",
  "timezone": "VN",
  "availableSlots": ["eve_daily", "morn_246"],
  "languages": [
    {
      "id": 10,
      "role": "native",
      "level": null,
      "language": { "id": 1, "code": "vi", "name": "Tiếng Việt" }
    },
    {
      "id": 11,
      "role": "learning",
      "level": "2",
      "language": { "id": 3, "code": "ja", "name": "Tiếng Nhật" }
    }
  ],
  "interests": [
    { "id": 5, "topic": { "id": 1, "name": "Du lịch" } },
    { "id": 6, "topic": { "id": 6, "name": "Công nghệ" } }
  ],
  "matchPreference": {
    "languageFocus": "Tiếng Nhật",
    "levelDesired": "3"
  }
}
```

---

### 3.2. Lấy thông tin công khai của người dùng khác
- **HTTP Method:** `GET`
- **Path:** `/users/:id`
- **Auth:** Public hoặc Require Token
- **Response (200 OK):**
```json
{
  "id": 2,
  "displayName": "Sarah Jenkins",
  "avatarUrl": "https://example.com/sarah.jpg",
  "bio": "English teacher living in Saigon.",
  "intent": "Giao tiếp casual",
  "dob": "1997-08-20",
  "gender": "Nữ",
  "city": "Hồ Chí Minh",
  "lastActive": "2026-07-26T16:30:00.000Z",
  "languages": [
    {
      "id": 20,
      "role": "native",
      "level": null,
      "language": { "id": 2, "code": "en", "name": "English" }
    },
    {
      "id": 21,
      "role": "learning",
      "level": "2",
      "language": { "id": 1, "code": "vi", "name": "Tiếng Việt" }
    }
  ],
  "interests": [
    { "id": 8, "topic": { "id": 1, "name": "Du lịch" } },
    { "id": 9, "topic": { "id": 5, "name": "Âm nhạc" } }
  ]
}
```

---

### 3.3. Cập nhật Hồ sơ cá nhân (Update Profile)
- **HTTP Method:** `PUT` (hoặc `PATCH`)
- **Path:** `/users/me`
- **Auth:** Require `Bearer Token`
- **Request Body (DTO):**
```json
{
  "displayName": "Viet Anh Dev",
  "avatarUrl": "data:image/jpeg;base64,...",
  "bio": "Giới thiệu mới...",
  "intent": "Làm việc",
  "gender": "Nam",
  "dob": "1998-05-15",
  "city": "Hà Nội",
  "timezone": "VN",
  "availableSlots": ["eve_daily"],
  "languages": [
    { "languageId": 1, "role": "native" },
    { "languageId": 3, "role": "learning", "level": "3" }
  ],
  "topicIds": [1, 6, 7],
  "matchPreference": {
    "languageFocus": "Tiếng Nhật",
    "levelDesired": "3"
  }
}
```
- **Logic xử lý Backend:**
  1. Validate `displayName` không được rỗng (tối đa 50 ký tự).
  2. Validate danh sách ngôn ngữ: Cần tối thiểu 1 ngôn ngữ dạy (`native`/`fluent`) và 1 ngôn ngữ học (`learning`).
  3. Cập nhật bảng `users`.
  4. Xóa và tạo mới lại các bản ghi trong `user_languages` và `user_interests` theo transaction.
  5. Upsert bảng `match_preferences`.

---

### 3.4. Kiểm tra mối quan hệ ghép đôi với thành viên khác
- **HTTP Method:** `GET`
- **Path:** `/matching/relation/:id`
- **Auth:** Require `Bearer Token`
- **Response (200 OK):**
```json
{
  "liked": true,
  "conversationId": 15
}
```

---

### 3.5. Lấy danh sách bài viết trên Profile (User Posts Filter)
- **HTTP Method:** `GET`
- **Path:** `/community/feed?userId=:userId`
- **Query Parameters:**
  - `userId` *(optional)*: ID người dùng cần xem bài viết.
- **Auth:** Public hoặc Require Token (để trả về trạng thái `likedByMe`).
- **Response (200 OK):**
```json
[
  {
    "id": 102,
    "type": "user_post",
    "content": "Chào mọi người! Hôm nay mình vừa hoàn thành buổi luyện nói 1:1 rất vui 🎉",
    "imageUrl": null,
    "createdAt": "2026-07-26T15:10:00.000Z",
    "likeCount": 5,
    "commentCount": 2,
    "likedByMe": false,
    "user": {
      "id": 1,
      "displayName": "Viet Anh",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  },
  {
    "id": 98,
    "type": "word_public",
    "content": null,
    "contentRef": "45",
    "createdAt": "2026-07-25T10:00:00.000Z",
    "likeCount": 3,
    "likedByMe": true,
    "user": { "id": 1, "displayName": "Viet Anh", "avatarUrl": "..." },
    "word": {
      "id": 45,
      "term": "Serendipity",
      "language": { "name": "English" }
    }
  }
]
```

---

### 3.6. Thống kê luyện tập (Practice Activity Stats)
- **HTTP Method:** `GET`
- **Path:** `/users/:id/chat-stats`
- **Auth:** Public hoặc Require Token
- **Response (200 OK):**
```json
{
  "totalChatHours": 4.5,
  "conversationCount": 3
}
```
- **Logic tính toán:**
  - `totalChatHours`: Tổng thời gian của các phiên nhắn tin tích cực (tính từ khoảng cách thời gian các tin nhắn trong cùng hội thoại, tự động cắt/bỏ qua các khoảng nghỉ > 30 phút).
  - `conversationCount`: Tổng số hội thoại (bản ghi `conversations`) mà người dùng có tham gia và đã gửi ít nhất 1 tin nhắn.

---

## 4. Ghi chú triển khai cho Lập trình viên Backend

1. **Transaction khi Update Profile:** Việc cập nhật ngôn ngữ (`user_languages`) và sở thích (`user_interests`) nên bọc trong `prisma.$transaction` để tránh dữ liệu mồ côi nếu xảy ra lỗi giữa chừng.
2. **Cấu hình CORS & Upload ảnh:** Nếu ảnh đại diện gửi dạng Base64 hoặc Multipart, cần nén và lưu trữ (hoặc upload Cloudinary/S3) trước khi lưu URL vào field `avatarUrl`.
3. **Index Database:** Tạo index trên các cột `userId` ở các bảng `user_languages`, `user_interests`, `activity_posts` để tăng tốc độ truy vấn bài viết và hồ sơ.
