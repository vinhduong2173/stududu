té

# API Contract Convention — stududu

**Version:** 2.0 · 26/07/2026 · Áp dụng cho `backend/` (NestJS) ↔ `frontend/` (Next.js)

> **Thay đổi so với v1.0:** mục 4 đổi hoàn toàn — response nay **bọc trong envelope `APIResponse<T>`** theo chỉ đạo của mentor. Bản v1.0 nói "trả thẳng object, không bọc" — **bỏ quy tắc đó**.

Tài liệu này quy định cách Backend và Frontend thoả thuận với nhau về API. Đọc cùng [coding-convention.md](coding-convention.md) (mục 4 = Git workflow) và `AGENTS.md` ở root repo.

---

## 1. Vấn đề đang có (đo tại 22/07/2026)

Backend khai báo **56 endpoint** trong 12 module. Frontend có **80 chỗ** gọi `api()`. Giữa hai bên **không có gì ràng buộc ngoài string và niềm tin**.

Ba triệu chứng cụ thể:

**Kiểu dữ liệu chỉ là lời hứa suông.** `frontend/src/lib/api.ts` kết thúc bằng `return (await res.json()) as T`. Đây là **ép kiểu**, không phải kiểm chứng. Khi FE viết `api<{ id: number; displayName: string }>("/users/me")`, TypeScript tin tuyệt đối. BE đổi `displayName` → `display_name` thì FE **vẫn build pass**, chỉ vỡ lúc người dùng bấm vào.

**Contract bị chép tay ở nhiều nơi.** FE có 43 interface/type rải trong 23 file, phần lớn là bản chép của DTO bên BE. Ví dụ có thật: contract của endpoint `POST /matching/like/:targetId` được viết inline **giống hệt nhau ở 2 file**:

```ts
// frontend/src/app/[locale]/(main)/discover/page.tsx      dòng 122
// frontend/src/app/[locale]/(main)/profile/[id]/page.tsx  dòng 70
api<{ mutual: boolean; conversation: { id: number } | null }>(`/matching/like/${id}`, ...)
```

Sửa BE thì phải nhớ sửa cả 2 chỗ — và không có gì nhắc.

**Contract đang lệch thật, không ai biết.** So sánh với `matching.service.ts` — hàm `like()` thực tế trả về `{ match, conversation, mutual }`:

|                  | FE đang khai báo                          | BE thực tế trả                               |
| ---------------- | ------------------------------------------- | ----------------------------------------------- |
| `mutual`       | `boolean`                                 | `boolean` ✅                                  |
| `conversation` | `{ id: number } \| null`                   | luôn có object (không bao giờ`null`) ⚠️ |
| `match`        | **không biết field này tồn tại** | có trả về ⚠️                               |

FE đang phòng thủ cho một trường hợp `null` không xảy ra, và mù hoàn toàn với field `match`. Đây là contract **đoán**, không phải contract **thoả thuận**.

## 2. Nguyên tắc: contract-first

> **Thoả thuận hình dạng ranh giới TRƯỚC, code hai bên SAU.**

Contract là bản thoả thuận *"gọi đường dẫn này, gửi dữ liệu hình dạng này, nhận về hình dạng kia, lỗi thì mã gì"*. Khi contract được chốt trước, BE và FE làm song song mà không phải chờ nhau — vì cả hai đã đồng ý ranh giới.

Ba vấn đề khác nhau, đừng nhầm lẫn:

| Vấn đề           | Nghĩa là gì                                 | Giải bằng                 |
| ------------------- | ---------------------------------------------- | --------------------------- |
| **Discovery** | FE không biết BE có những endpoint nào    | Swagger (mục 6)            |
| **Blocking**  | FE phải chờ BE code xong mới làm được   | Stub / waiting API (mục 5) |
| **Drift**     | Hai bên lệch shape mà không ai phát hiện | Shared types (mục 3)       |

**Chỉ làm stub là chưa đủ** — nó giải Blocking nhưng để nguyên Drift: stub trả một hình dạng, BE code thật sau đó trả hình dạng khác, FE không hay biết.

## 3. Nơi đặt contract: thư mục `shared/`

Cả BE và FE đều TypeScript, nên contract định nghĩa **một lần** ở `shared/`, hai bên cùng import. Đây là cách giải Drift triệt để: BE đổi type → **FE build đỏ ngay**, không đợi tới lúc demo mới vỡ.

### 3.1. Cấu trúc

```
shared/
  api/
    common.ts         # kiểu dùng chung: ApiError, Paginated<T>, Id
    auth.contract.ts
    matching.contract.ts
    chat.contract.ts
    vocabulary.contract.ts
    ...               # 1 file / 1 module, khớp backend/src/modules/
  index.ts            # re-export
```

Quy tắc đặt tên: `<module>.contract.ts`, tên module **khớp đúng** tên thư mục trong `backend/src/modules/`.

### 3.2. Nội dung một file contract

Mỗi endpoint khai báo đủ 3 phần: **đường dẫn**, **request**, **response**.

```ts
// shared/api/matching.contract.ts

/** FS-08 — gợi ý đối tác. GET /matching/suggestions */
export interface GetSuggestionsQuery {
  languageId?: number;
  offset?: number;
}
export interface SuggestionItem {
  user: { id: number; displayName: string; avatarUrl: string | null };
  matchScore: number;
  liked: boolean;
  conversationId: number | null;
}
export interface GetSuggestionsResponse {
  items: SuggestionItem[];
  total: number;
}

/** US-13 — thích một đối tác. POST /matching/like/:targetId */
export interface LikeResponse {
  match: { id: number; status: 'liked' | 'mutual' };
  conversation: { id: number };
  mutual: boolean;
}

/** Danh sách đường dẫn — KHÔNG viết string rời rạc trong component */
export const MATCHING_ROUTES = {
  suggestions: '/matching/suggestions',
  members: '/matching/members',
  like: (targetId: number) => `/matching/like/${targetId}`,
  relation: (targetId: number) => `/matching/relation/${targetId}`,
} as const;
```

### 3.3. Hai bên dùng thế nào

**Backend** — dùng contract làm kiểu trả về, để compiler ép service trả đúng:

```ts
import type { LikeResponse } from '@shared/api/matching.contract';

async like(userId: number, targetId: number): Promise<LikeResponse> { ... }
```

**Frontend** — bỏ type viết inline, import contract:

```ts
import { MATCHING_ROUTES, type LikeResponse } from '@shared/api/matching.contract';

const result = await api<LikeResponse>(MATCHING_ROUTES.like(targetId), { method: 'POST' });
```

Kết quả: contract nằm **một chỗ duy nhất**. Sửa BE mà quên báo FE → build đỏ ngay, không im lặng chờ tới demo.

### 3.4. Setup (việc của Dev — chưa thực hiện)

Thêm path alias vào `tsconfig.json` của **cả hai** project:

```jsonc
// backend/tsconfig.json và frontend/tsconfig.json
{
  "compilerOptions": {
    "paths": { "@shared/*": ["../shared/*"] }
  },
  "include": ["src", "../shared"]
}
```

Với Next.js có thể cần thêm `transpilePackages` hoặc chỉnh `outDir` bên NestJS — Dev tự kiểm tra khi setup. **Đây là điểm dễ vướng nhất**, nên làm thử trên một nhánh `feature/*` riêng trước khi áp cho cả team.

## 4. Envelope thống nhất Request/Response

**Chỉ đạo từ mentor (26/07/2026).** Mọi response của API bọc trong một lớp vỏ chung thay vì trả thẳng object. Lợi ích: FE xử lý lỗi ở một chỗ duy nhất, có sẵn `message` cho i18n, có `version` để tiến hoá API mà không phá client cũ.

### 4.1. Kiểu envelope

Khai ở `shared/api/common.ts`:

```ts
export interface APIResponse<T> {
  data: T;
  status: string;
  message: string;
}

export interface APIRequest<T> {
  payload: T;
  headers: {
    token: string;
    version: number;
  };
}
```

Cách dùng — `T` là dữ liệu nghiệp vụ thật, envelope là phần vỏ:

```ts
export interface User {
  name: string;
  age: number;
}
export interface VerifyEmailResponse {
  accessToken: string;
  user: User;
}

APIResponse<VerifyEmailResponse>   // 1 object
APIResponse<User[]>                // danh sách
APIResponse<Paginated<User>>       // danh sách có phân trang
```

Hai helper dùng chung:

```ts
export function handleAPIData<T>(res: APIResponse<T>): T {
  return res.data;
}
export function handleAPIError<T>(err: APIResponse<T>): void {
  console.log(err.message);
}
```

Phân trang vẫn giữ nguyên hình dạng cũ, **nằm bên trong `data`** chứ không ngang hàng envelope:

```ts
export interface Paginated<T> {
  items: T[];
  total: number;
}
```

### 4.2. Triển khai — rẻ hơn vẻ ngoài rất nhiều

Repo có **56 endpoint** và **80 chỗ gọi `api()`**. Nghe như phải sửa 136 chỗ, nhưng thực tế **chỉ sửa 3 file**:

**Backend — 2 file, không đụng vào bất kỳ controller nào.**

Một interceptor global bọc mọi response thành công:

```ts
// backend/src/common/interceptors/transform.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { APIResponse } from '@shared/api/common';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, APIResponse<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<APIResponse<T>> {
    return next.handle().pipe(
      map((data) => ({ data, status: 'success', message: '' })),
    );
  }
}
```

Một exception filter global bọc mọi lỗi về đúng envelope:

```ts
// backend/src/common/filters/all-exceptions.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const rawMessage =
      typeof raw === 'object' && raw !== null ? (raw as { message?: string | string[] }).message : null;
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? 'Internal server error');

    res.status(httpStatus).json({ data: null, status: 'error', message });
  }
}
```

Đăng ký ở `main.ts` (cạnh `LoggingInterceptor` đang có sẵn):

```ts
app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
app.useGlobalFilters(new AllExceptionsFilter());
```

**Frontend — đúng 1 file, 80 call site không đổi một dòng.**

Vì `api<T>()` vẫn trả về `T`, việc bóc vỏ làm ngay bên trong nó:

```ts
// frontend/src/lib/api.ts — phần cuối hàm api()
if (!res.ok) {
  const body = (await res.json().catch(() => null)) as APIResponse<null> | null;
  // ... giữ nguyên xử lý 401 hiện có ...
  throw new ApiError(res.status, body?.message ?? res.statusText);
}

if (res.status === 204) return undefined as T;
const body = (await res.json()) as APIResponse<T>;
return body.data;          // ← bóc vỏ tại đây
```

> **Đây là điểm mấu chốt khi ước lượng:** hạng mục này tính bằng **giờ**, không phải ngày. Ai ước lượng "phải sửa 56 endpoint" là đang hiểu sai cách NestJS hoạt động.

### 4.3. Mã lỗi HTTP — giữ nguyên

Envelope **không thay thế** HTTP status code. `res.status` vẫn phải đúng, vì FE và trình duyệt dựa vào đó (vd tự đá về `/login` khi 401):

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu gửi lên sai định dạng (ValidationPipe tự trả) |
| 401 | Chưa đăng nhập / token hết hạn — FE tự đá về `/login` |
| 403 | Đã đăng nhập nhưng không đủ quyền (vd không phải `role=admin`) |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột nghiệp vụ (vd đã like rồi, đã lưu từ này rồi) |
| 422 | Đúng định dạng nhưng vi phạm business rule (vd BR-04 thiếu ngôn ngữ để match) |

Không tự bịa mã mới. Vi phạm business rule ở `AGENTS.md` mục 3 → dùng 409/422 kèm `message` rõ, đừng trả 400 chung chung.

### 4.4. Ba điểm PHẢI hỏi lại mentor trước khi code

Bản phác của mentor còn mơ hồ ở ba chỗ. Hiểu sai chỗ đầu tiên là hỏng cả module auth — đừng đoán.

**1. `APIRequest<T>` có phải là body JSON không?**

Trong HTTP, token thuộc header `Authorization: Bearer ...` chứ không nằm trong body. `frontend/src/lib/api.ts` và `JwtAuthGuard` bên NestJS đang chạy đúng chuẩn đó. Nếu hiểu `APIRequest` theo nghĩa đen — bọc body thành `{ payload, headers: { token } }` — thì **toàn bộ guard hiện có ngừng hoạt động**, và token bị lặp ở hai nơi.

Cách hiểu nhiều khả năng đúng: `APIRequest<T>` mô tả *khái niệm* một lời gọi API (payload + metadata), dùng để type hoá hàm gọi ở FE, còn khi lên đường dây thì `payload` là body và `headers` là HTTP header thật. **Chốt với mentor trước.**

**2. `status: string` mang giá trị gì?**

Là `"success" | "error"`, hay là chuỗi mã HTTP (`"200"`)? Nếu là mã HTTP thì trùng lặp với `res.status` — thừa và dễ lệch. Đề xuất: dùng union `'success' | 'error'` để compiler kiểm được, thay vì `string` tự do.

**3. Socket.IO có áp envelope không?**

Interceptor và filter chỉ chặn HTTP. Chat realtime (`Socket.IO`) đi đường riêng, sẽ **không** tự động có envelope. Nếu không chốt, chat thành ngoại lệ — đúng cái bệnh "features rời rạc" mentor đã chê. Cần quyết định: áp envelope cho socket event luôn, hay ghi rõ socket là ngoại lệ có chủ đích.

## 5. Waiting API (stub) — quy tắc dùng

Dùng khi contract đã chốt nhưng BE chưa kịp code logic thật, mà FE cần gọi được ngay.

**Cách làm:** BE tạo endpoint trả dữ liệu mẫu **đúng type trong `shared/`**:

```ts
// TODO(stub): US-08 — thay bằng logic thật. Hạn xoá: 30/07/2026. Owner: BE Dev
@Get('suggestions')
getSuggestions(): GetSuggestionsResponse {
  return {
    items: [
      { user: { id: 1, displayName: 'Nguyen Van A', avatarUrl: null },
        matchScore: 87, liked: false, conversationId: null },
    ],
    total: 1,
  };
}
```

**Bốn quy tắc bắt buộc:**

1. Stub phải trả **đúng type đã khai trong `shared/`** — sai type thì stub vô nghĩa, FE code theo cái sẽ không tồn tại.
2. Luôn có comment `// TODO(stub): <US> — Hạn xoá: <ngày>. Owner: <ai>`. Không có hạn = stub sẽ sống mãi.
3. **Stub không được merge vào `main`.** Merge vào `develop` thì được, nhưng phải xoá hết trước khi `develop → main`.
4. Trước Sprint Review, grep `TODO(stub)` toàn repo — còn cái nào là còn việc chưa xong, phải báo trong Review chứ không giấu.

**Cảnh báo:** stub là công cụ tạm, không phải giải pháp. Đừng dựng stub hàng loạt cho toàn bộ backlog — chỉ dựng khi có một US cụ thể đang bị FE chờ BE.

## 6. Swagger — để FE tự tra endpoint

Backend hiện **chưa cài** `@nestjs/swagger`, nên muốn biết BE có gì phải mở 12 file controller đọc. Cài Swagger giải quyết việc này với chi phí rất thấp:

```bash
cd backend && npm i @nestjs/swagger
```

```ts
// backend/src/main.ts — thêm trước app.listen()
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Stududu API')
  .setDescription('API cho web trao đổi ngôn ngữ Stududu')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
```

Sau đó mở `http://localhost:3001/api/docs` là thấy toàn bộ endpoint, bấm "Try it out" gọi thử được luôn. DTO của repo đã dùng `class-validator` nên phần request tự hiện sẵn.

Với response, thêm decorator vào controller để schema không rỗng:

```ts
@ApiOperation({ summary: 'FS-08 — gợi ý đối tác luyện nói' })
@ApiResponse({ status: 200, description: 'Danh sách gợi ý kèm MATCH_SCORE' })
```

**Lưu ý:** Swagger sinh docs *từ* code, nên nó giải Discovery chứ **không** giải Drift — vẫn cần `shared/` (mục 3).

## 7. Luồng làm việc BE ↔ FE cho một User Story

```
1. BA/PO chốt User Story + Acceptance Criteria
2. BE + FE ngồi cùng 15 phút → thống nhất contract
3. Người phụ trách US commit contract vào shared/api/<module>.contract.ts
   → PR nhỏ riêng, merge sớm vào develop (KHÔNG chờ code xong)
4. Từ lúc này BE và FE làm SONG SONG:
     BE: implement service, kiểu trả về ràng bằng contract
     FE: code UI, gọi api<T>() với T lấy từ contract
         (BE dựng stub nếu FE cần gọi được ngay — mục 5)
5. Nối thật, test tích hợp
6. Xoá stub, mở PR theo luồng ở coding-convention.md mục 4
```

**Bước 3 là mấu chốt.** Contract merge vào `develop` sớm và riêng lẻ, trước khi hai bên code. Đây chính là "waiting API" mà mentor nói — nhưng ở dạng có kiểm chứng bằng compiler, không chỉ là endpoint trả JSON cứng.

**Ai sửa contract sau khi đã chốt?** Người phát hiện cần đổi phải **báo cả hai bên và sửa ở `shared/`**, không tự sửa lệch một phía. Contract thay đổi = PR riêng, tiêu đề `contract(<module>): ...`.

## 8. Definition of Done cho một endpoint

Một endpoint chỉ được coi là xong khi:

- [ ] Contract (route + request + response) đã khai trong `shared/api/<module>.contract.ts`
- [ ] Response đi qua envelope `APIResponse<T>` — interceptor global lo, **không tự bọc tay** trong controller
- [ ] BE: kiểu trả về của service ràng buộc bằng type trong contract (không `any`)
- [ ] FE: gọi qua hằng route trong contract, **không** viết string đường dẫn rời rạc
- [ ] FE: không còn type viết inline cho endpoint này
- [ ] Có `@ApiOperation` + `@ApiResponse` để Swagger hiển thị đúng
- [ ] Mã lỗi HTTP đúng bảng ở mục 4.3
- [ ] Không còn `TODO(stub)` cho endpoint này
- [ ] Không vi phạm business rule ở `AGENTS.md` mục 3

## 9. Lộ trình áp dụng — không làm big bang

Repo đang có 56 endpoint và 80 call site. **Không viết lại tất cả cùng lúc** — vừa tốn thời gian vừa dễ vỡ giữa Sprint. Áp dụng dần:

| Bước | Việc | Ghi chú |
|---|---|---|
| 1 | **Envelope `APIResponse<T>`** — `TransformInterceptor` + `AllExceptionsFilter` + sửa `api.ts` | Mentor yêu cầu; tính bằng giờ, không đụng 56 controller |
| 2 | Cài Swagger + setup `main.ts` | ~30 phút, giá trị thấy ngay, không đụng logic |
| 3 | Dựng `shared/` + setup tsconfig, làm thử **1 module** (đề xuất: `matching`) | Làm trên nhánh riêng; đây là bước dễ vướng nhất |
| 4 | Sửa 2 chỗ gọi `POST /matching/like` đang chép tay | Ví dụ ở mục 1 — sửa được ngay, chứng minh giá trị |
| 5 | Endpoint **mới** từ nay bắt buộc theo convention này | Không cho phát sinh nợ mới |
| 6 | Endpoint cũ: migrate dần khi có dịp đụng vào | Không tạo task "refactor toàn bộ" |

**Nguyên tắc:** ngừng đào sâu thêm hố (bước 5) quan trọng hơn lấp hố cũ (bước 6).

**Thứ tự có lý do:** bước 1 làm trước vì nó đổi hình dạng *mọi* response — làm sau khi đã viết contract ở `shared/` thì phải sửa lại contract lần nữa.

## 10. Việc cần chốt

- **Ba câu hỏi về envelope ở mục 4.4** — phải có câu trả lời của mentor **trước khi bắt tay code**, đặc biệt câu về `APIRequest<T>`. Hiểu sai chỗ đó là hỏng module auth.
- Ai đứng ra setup `shared/` + tsconfig (bước 3)? Việc kỹ thuật, cần người rành build của cả Next.js lẫn NestJS.
- Có bật `strict` cho `shared/` không, hay theo tsconfig từng bên?
- Endpoint cũ có đặt hạn migrate không, hay để "khi nào đụng thì sửa"?
