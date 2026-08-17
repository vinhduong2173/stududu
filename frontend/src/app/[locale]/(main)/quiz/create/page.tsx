"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload, ArrowLeft, Loader2, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CEFR_LEVELS, LanguageRef, VocabTopic } from "@/lib/questionSets";
import { Link } from "@/i18n/routing";

const INPUT_CLASS =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary shadow-xs";

export default function CreateQuizPage() {
  const router = useRouter();
  const [languages, setLanguages] = React.useState<LanguageRef[]>([]);
  const [topics, setTopics] = React.useState<VocabTopic[]>([]);
  const [loadingInit, setLoadingInit] = React.useState(true);

  const [form, setForm] = React.useState({
    languageId: 0,
    topicId: 0,
    framework: "CEFR",
    level: "A1",
    title: "",
    description: "",
    questionCount: 10,
    note: "",
  });

  const [file, setFile] = React.useState<File | null>(null);
  const [statusStep, setStatusStep] = React.useState<
    "idle" | "creating" | "generating" | "importing" | "publishing" | "done"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      api<LanguageRef[]>("/question-sets/topics")
        .then(() => api<LanguageRef[]>("/admin/languages"))
        .catch(() => [
          { id: 1, code: "vi", name: "Tiếng Việt" },
          { id: 2, code: "en", name: "English" },
          { id: 3, code: "zh", name: "中文" },
          { id: 4, code: "ja", name: "日本語" },
          { id: 5, code: "ko", name: "한국어" },
        ]),
      api<VocabTopic[]>("/question-sets/topics"),
    ])
      .then(([langs, tps]) => {
        setLanguages(langs);
        setTopics(tps);
        if (langs.length > 0) setForm((f) => ({ ...f, languageId: langs[0].id }));
        if (tps.length > 0) setForm((f) => ({ ...f, topicId: tps[0].id }));
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoadingInit(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề bài thi");
      return;
    }
    if (!file && !form.note.trim()) {
      setError("Vui lòng tải lên file tài liệu hoặc nhập nội dung bài học để AI sinh câu hỏi");
      return;
    }

    try {
      // Step 1: Create Set shell
      setStatusStep("creating");
      const createdSet = await api<{ id: number }>("/question-sets/user-create", {
        method: "POST",
        body: {
          languageId: form.languageId,
          topicId: form.topicId,
          framework: form.framework,
          level: form.level,
          title: form.title,
          description: form.description,
        },
      });

      // Step 2: Generate Questions via Gemini AI
      setStatusStep("generating");
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        const blob = new Blob([form.note], { type: "text/plain" });
        formData.append("file", blob, "lesson-note.txt");
      }
      formData.append("questionCount", String(form.questionCount));
      if (form.note) formData.append("note", form.note);

      const dryRun = await api<{
        rows: { valid: boolean; question: any }[];
        sourceMeta: any;
      }>(`/question-sets/${createdSet.id}/user-generate`, {
        method: "POST",
        body: formData,
      });

      const validQuestions = dryRun.rows.filter((r) => r.valid && r.question).map((r) => r.question);
      if (validQuestions.length === 0) {
        throw new Error("AI không sinh được câu hỏi nào từ nội dung tài liệu này. Vui lòng kiểm tra lại tài liệu.");
      }

      // Step 3: Import Questions
      setStatusStep("importing");
      await api(`/question-sets/${createdSet.id}/user-import`, {
        method: "POST",
        body: {
          questions: validQuestions,
          aiGenerated: true,
          sourceMeta: dryRun.sourceMeta,
        },
      });

      // Step 4: Publish Set
      setStatusStep("publishing");
      await api(`/question-sets/${createdSet.id}/user-publish`, {
        method: "POST",
      });

      setStatusStep("done");
      setTimeout(() => {
        router.push(`/quiz/${createdSet.id}`);
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Tạo bài thi AI thất bại");
      setStatusStep("idle");
    }
  };

  const isProcessing = statusStep !== "idle" && statusStep !== "done";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      {/* Back Link */}
      <div>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài thi
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-md shadow-primary/20">
            <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">Tạo đề thi bằng AI (Gemini)</h1>
            <p className="text-xs md:text-sm text-muted">
              Tải tài liệu (.pdf, .docx, .txt) hoặc dán nội dung bài học ➔ Gemini AI sẽ tự động tạo bộ trắc nghiệm cho bạn!
            </p>
          </div>
        </div>

        {loadingInit ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Ngôn ngữ bài thi</span>
                <select
                  className={INPUT_CLASS}
                  value={form.languageId}
                  onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}
                  disabled={isProcessing}
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Chủ đề từ vựng</span>
                <select
                  className={INPUT_CLASS}
                  value={form.topicId}
                  onChange={(e) => setForm({ ...form, topicId: Number(e.target.value) })}
                  disabled={isProcessing}
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Trình độ (CEFR)</span>
                <select
                  className={INPUT_CLASS}
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  disabled={isProcessing}
                >
                  {CEFR_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Số lượng câu hỏi</span>
                <select
                  className={INPUT_CLASS}
                  value={form.questionCount}
                  onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) })}
                  disabled={isProcessing}
                >
                  <option value={5}>5 câu (Ôn nhanh 3 phút)</option>
                  <option value={10}>10 câu (Tiêu chuẩn 5 phút)</option>
                  <option value={15}>15 câu (Chi tiết 10 phút)</option>
                  <option value={20}>20 câu (Bộ đề thi đầy đủ 15 phút)</option>
                </select>
              </label>
            </div>

            {/* Title */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-foreground">Tiêu đề bài thi *</span>
              <input
                className={INPUT_CLASS}
                placeholder="Ví dụ: Ôn tập từ vựng chủ đề Du lịch · A1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={isProcessing}
                required
              />
            </label>

            {/* Content Source */}
            <div className="space-y-3 rounded-3xl border border-dashed border-border bg-background p-5 md:p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Nguồn nội dung để AI tạo câu hỏi *</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground hover:border-primary transition-colors shadow-xs">
                  <Upload className="h-4 w-4 text-primary" />
                  {file ? file.name : "Tải file tài liệu (.pdf, .docx, .txt)"}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={isProcessing}
                  />
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs font-semibold text-rose-500 hover:underline px-2"
                  >
                    Xóa file
                  </button>
                )}
              </div>

              <div className="text-center text-xs text-muted font-medium">— Hoặc dán văn bản bên dưới —</div>

              <textarea
                className={cn(INPUT_CLASS, "min-h-28 text-xs font-normal")}
                placeholder="Dán bài đọc, danh sách từ vựng hoặc đoạn văn bản bất kỳ để Gemini AI trích xuất câu hỏi..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                disabled={isProcessing}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-bold text-primary animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                <span>
                  {statusStep === "creating" && "1. Đang khởi tạo khung bài thi..."}
                  {statusStep === "generating" && "2. Gemini AI đang phân tích bài học và sinh câu hỏi trắc nghiệm..."}
                  {statusStep === "importing" && "3. Đang thẩm định và lưu câu hỏi..."}
                  {statusStep === "publishing" && "4. Đang xuất bản bài thi..."}
                </span>
              </div>
            )}

            {statusStep === "done" && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Tạo bài thi AI thành công! Đang chuyển hướng vào làm bài thi...</span>
              </div>
            )}

            {/* Form Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => router.push("/quiz")}
                disabled={isProcessing}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="md"
                className="sd-btn-gradient px-6 py-2.5 font-extrabold rounded-2xl"
                disabled={isProcessing || loadingInit}
              >
                <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                {isProcessing ? "Đang xử lý..." : "Sinh bài thi bằng AI"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
