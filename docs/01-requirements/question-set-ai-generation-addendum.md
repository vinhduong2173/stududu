# Addendum — AI sinh câu hỏi từ tài liệu + Admin xem trước như học viên

**Người lập:** Vinh (BA) · **Ngày:** 28/07/2026 · **Trạng thái:** 🟢 **ĐÃ CHỐT (03/08/2026)** — không còn là backlog. Khôi phục sau sự cố mất file khi đổi nhánh. **Luồng nhập câu hỏi đã chuyển hẳn sang AI-only + nhập tay dự phòng, xem [`question-set-ai-only-flow.md`](question-set-ai-only-flow.md)** — tài liệu đó là nguồn chính cho luồng nhập liệu. File này giữ lại phần **prompt AI** và **toggle xem trước như học viên**, không đổi.

**Liên quan:** [`question-set-design.md`](question-set-design.md) (data model gốc), [`question-set-ai-only-flow.md`](question-set-ai-only-flow.md) (luồng nhập hiện hành).

---

## 1. Hai việc bổ sung

1. **AI sinh câu hỏi trực tiếp từ tài liệu** Admin tải lên (PDF/DOCX/TXT) — không qua bước tạo CSV thủ công.
2. **Admin xem trước từng câu** đúng như giao diện học viên sẽ thấy, trước khi publish — không chỉ đọc text thô trong bảng.

## 2. Prompt AI sinh câu hỏi

Input cho AI: đoạn văn bản đã trích xuất (xem `file-extractor.service.ts` trong `question-set-ai-only-flow.md`), + `framework`/`level` do Admin chọn trước, + số câu mong muốn (mặc định 20).

```
Bạn là người biên soạn câu hỏi trắc nghiệm tiếng {targetLanguage} cho người học trình độ {framework} {level}.

Từ đoạn văn bản sau, hãy sinh ra {questionCount} câu hỏi trắc nghiệm (4 đáp án, đúng 1 đáp án đúng).

QUY TẮC BẮT BUỘC:
1. Độ khó phải đúng trình độ {level} — không dùng từ vựng/ngữ pháp vượt quá cấp độ này.
2. Mỗi câu có đúng 1 đáp án đúng, 3 đáp án nhiễu (distractor).
3. Đáp án nhiễu phải HỢP LÝ — cùng loại từ, cùng độ dài tương đối, không sai ngữ pháp lộ liễu.
   Tránh nhiễu kiểu "rõ ràng sai" (vd: đáp án đúng là danh từ, 3 nhiễu là động từ).
4. Không lặp lại cùng một từ/khái niệm quá 3 câu trong bộ.
5. Ưu tiên loại câu: vocabulary (nghĩa từ trong ngữ cảnh), cloze (điền từ vào chỗ trống), reading (đọc hiểu đoạn ngắn).
6. Viết `explanation` ngắn gọn giải thích vì sao đáp án đúng, bằng tiếng Việt.
7. Nếu đoạn văn bản không đủ nội dung để sinh đủ {questionCount} câu chất lượng, sinh ít hơn — KHÔNG bịa nội dung ngoài đoạn văn bản.

Đoạn văn bản:
"""
{extractedText}
"""

Trả về JSON đúng schema:
{
  "questions": [
    {
      "type": "vocabulary" | "cloze" | "reading",
      "term": string | null,
      "passage": string | null,
      "prompt": string,
      "options": [string, string, string, string],
      "answerIndex": number,
      "explanation": string
    }
  ]
}
```

## 2b. Nhà cung cấp AI — đổi từ Claude Haiku sang Gemini (05/08/2026)

**Quyết định:** dùng **Google Gemini** (`gemini-2.5-flash`, đổi được qua biến `GEMINI_MODEL`) thay cho Claude Haiku ghi ở bản đầu.

| Nội dung | Chi tiết |
|---|---|
| Lý do | Anthropic **không có gói miễn phí** cho API, chỉ bán tín dụng trả trước. Gemini có gói free thật, đủ cho nhịp một Admin thi thoảng soạn đề — phù hợp ràng buộc ngân sách của đồ án (xem AGENTS.md mục 10, "ngân sách API" vốn là câu hỏi chưa chốt) |
| Vì sao chọn Gemini chứ không phải bên free khác | Bộ đề và phần `explanation` đều bằng tiếng Việt; đây đúng là chỗ model mở chạy trên Groq/Ollama yếu nhất, mà chất lượng đáp án nhiễu lại là điều quy tắc 3 ở mục 2 nhấn mạnh nhất. Gemini cũng có chế độ ràng buộc JSON schema nên giữ nguyên được cách chống lỗi định dạng |
| **Prompt không đổi** | Toàn bộ mục 2 giữ nguyên, kể cả `PROMPT_VERSION`. Đổi nhà cung cấp không phải đổi nội dung prompt |
| Khác biệt kỹ thuật | Gemini dùng tập con OpenAPI schema: trường cho phép null đánh dấu `nullable: true`, **không dùng `anyOf`** như JSON Schema thuần |
| `sourceMeta.model` | Ghi tên model Gemini thực tế — BR-49 vẫn nguyên giá trị truy vết |
| Phạm vi ảnh hưởng | Chỉ `ai-question-generator.service.ts`. Pipeline validate/dry-run/xem trước/publish **không đụng tới** |
| Hạn mức | Gói free giới hạn số request/phút. Chạm trần trả lỗi riêng ("Đã chạm hạn mức miễn phí"), Admin chuyển sang form nhập tay theo BR-56 |
| Nếu muốn quay lại Claude | Chỉ cần viết lại đúng một file trên. Cân nhắc khi cần chất lượng cao hơn và có ngân sách |

**Biến môi trường:** `GEMINI_API_KEY` (lấy tại <https://aistudio.google.com/apikey>), `GEMINI_MODEL` (tuỳ chọn). Xem `backend/.env.example`.

**Ghi chú thiết kế:**

- Quy tắc 3 (nhiễu hợp lý) và quy tắc 7 (không bịa) là hai điểm mentor/BA cần audit thủ công nhiều nhất — Admin **phải** xem qua từng câu trước khi publish (xem mục 4), không tin tưởng AI 100%.
- `sourceMeta` lưu lại: `{ model, promptVersion, extractedCharCount, generatedAt }` — phục vụ truy vết khi có câu hỏi lỗi, không phải để hiển thị cho ai.

## 3. Xử lý khi AI sinh thiếu / lỗi

| Tình huống | Xử lý |
|---|---|
| AI trả về ít hơn `questionCount` yêu cầu | Chấp nhận, hiển thị số thực tế sinh được. Admin tự thêm bằng form nhập tay (xem `question-set-ai-only-flow.md` mục 4) cho đủ 20 |
| AI trả JSON sai schema | Retry 1 lần tự động; vẫn lỗi → báo Admin, không chặn — Admin chuyển sang nhập tay |
| Tài liệu quá ngắn (<200 ký tự sau khi làm sạch) | Chặn từ bước trích xuất, xem `file-extractor.service.ts` |

## 4. Xem trước như học viên (Preview toggle)

Màn soạn đề của Admin có 2 chế độ xem cho mỗi câu:

- **Chế độ soạn (mặc định):** bảng dữ liệu thô — `prompt`, 4 `options`, đánh dấu đáp án đúng, `explanation`. Sửa trực tiếp tại đây.
- **Chế độ xem trước (toggle "👁 Xem như học viên"):** render đúng component `QuizQuestionCard` mà học viên dùng khi làm bài — cùng CSS, cùng thứ tự đáp án hiển thị (không đảo để Admin xem đúng cái sẽ thấy), **không hiện đáp án đúng** cho tới khi Admin bấm chọn thử.

**Vì sao cần 2 chế độ chứ không chỉ 1:** bảng dữ liệu thô giúp sửa nhanh nhiều câu liên tiếp; chế độ xem trước bắt được lỗi trình bày (câu quá dài bị cắt, ảnh không hiện, layout vỡ trên mobile) mà bảng dữ liệu không lộ ra.

Kỹ thuật: tái dùng nguyên component `QuizQuestionCard` (frontend, dùng chung giữa preview và luồng làm bài thật) — truyền prop `mode="preview" | "attempt"` để tắt việc gọi API chấm điểm khi ở preview.

## 5. Business rules bổ sung

- **BR-48:** Câu hỏi AI sinh phải qua Admin duyệt (xem/sửa) trước khi tính vào số câu publish — không tự động publish câu AI sinh.
- **BR-49:** `sourceMeta` bắt buộc lưu khi `source = ai_generated`, phục vụ truy vết.
- **BR-50:** Chế độ xem trước không đảo thứ tự đáp án (khác với lúc học viên làm bài thật, xem `question-set-design.md` mục 7) — Admin cần thấy đúng thứ tự đã nhập để dễ đối chiếu.
- **BR-51:** AI không được bịa nội dung ngoài văn bản nguồn (áp trong prompt, quy tắc 7) — nếu phát hiện vi phạm nhiều, cần xem lại prompt/model trước khi tắt tính năng.
- **BR-52:** Giới hạn 1 lần gọi AI generate / bộ đề / phút (chống spam do bấm nhầm), không giới hạn số lần/ngày ở giai đoạn này.
- **BR-53:** Nếu Admin sửa tay một câu AI sinh, `source` giữ nguyên `ai_generated` (không đổi thành `manual`) — vì nguồn gốc nội dung vẫn từ AI, chỉ là được hiệu đính.

## 6. Việc cần làm (bổ sung vào task table ở `question-set-ai-only-flow.md`)

| Việc | Ưu tiên |
|---|---|
| Viết prompt template ở mục 2 thành constant trong code, tách khỏi business logic để dễ chỉnh | Cao |
| Component `QuizQuestionCard` — thêm prop `mode` | Cao |
| Toggle UI xem trước trong màn soạn đề | Cao |
| Rate limit BR-52 | Trung bình |
| Log `sourceMeta` đầy đủ mỗi lần generate | Trung bình |

## 7. Checklist test bổ sung

- [ ] Upload PDF hợp lệ → sinh đủ 20 câu → mỗi câu có `sourceMeta` đúng
- [ ] Upload file có <200 ký tự → bị chặn với thông báo rõ ràng
- [ ] AI trả JSON sai schema → tự retry, vẫn lỗi → Admin thấy thông báo, không bị treo màn hình
- [ ] Bật toggle xem trước → giao diện khớp 100% với màn làm bài thật của học viên
- [ ] Sửa tay 1 câu AI sinh → `source` vẫn là `ai_generated` sau khi lưu
- [ ] Gọi generate 2 lần liên tiếp trong 1 phút cho cùng 1 bộ → lần 2 bị chặn theo BR-52
