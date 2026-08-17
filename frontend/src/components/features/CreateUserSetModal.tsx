"use client";

import * as React from "react";
import { Sparkles, Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CEFR_LEVELS, LanguageRef, VocabTopic } from "@/lib/questionSets";

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary";

export function CreateUserSetModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (newSetId: number) => void;
}) {
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
      api<LanguageRef[]>("/question-sets/topics").then(() => api<LanguageRef[]>("/admin/languages")).catch(() => [
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
        // Create virtual txt file from note
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
        onCreated(createdSet.id);
      }, 500);
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Tạo bài thi AI thất bại");
      setStatusStep("idle");
    }
  };

  const isProcessing = statusStep !== "idle" && statusStep !== "done";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Tạo đề thi bằng AI (Gemini)</h2>
              <p className="text-xs text-muted">Tự động sinh bộ câu hỏi trắc nghiệm từ tài liệu</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingInit ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">Ngôn ngữ</span>
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
                <span className="mb-1 block text-xs font-semibold text-muted">Chủ đề từ vựng</span>
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
                <span className="mb-1 block text-xs font-semibold text-muted">Trình độ</span>
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
                <span className="mb-1 block text-xs font-semibold text-muted">Số lượng câu hỏi</span>
                <select
                  className={INPUT_CLASS}
                  value={form.questionCount}
                  onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) })}
                  disabled={isProcessing}
                >
                  <option value={5}>5 câu (Ôn nhanh)</option>
                  <option value={10}>10 câu (Tiêu chuẩn)</option>
                  <option value={15}>15 câu (Chi tiết)</option>
                  <option value={20}>20 câu (Bộ đề đầy đủ)</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Tiêu đề bộ đề thi *</span>
              <input
                className={INPUT_CLASS}
                placeholder="Ví dụ: Ôn tập từ vựng chủ đề Du lịch · A1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={isProcessing}
                required
              />
            </label>

            <div className="space-y-2 rounded-2xl border border-dashed border-border bg-background p-4">
              <span className="block text-xs font-semibold text-foreground">Nguồn nội dung tạo câu hỏi *</span>
              
              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/10">
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
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Xóa file
                  </button>
                )}
              </div>

              <span className="block text-center text-xs text-muted">Hoặc</span>

              <textarea
                className={cn(INPUT_CLASS, "min-h-20 text-xs")}
                placeholder="Dán nội dung từ vựng hoặc bài học cần Gemini AI tạo câu hỏi trắc nghiệm..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                disabled={isProcessing}
              />
            </div>
          </>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs font-medium text-primary">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>
              {statusStep === "creating" && "Đang khởi tạo khung bài thi..."}
              {statusStep === "generating" && "Gemini AI đang đọc nội dung và sinh câu hỏi trắc nghiệm..."}
              {statusStep === "importing" && "Đang lưu câu hỏi vào hệ thống..."}
              {statusStep === "publishing" && "Đang xuất bản bài thi..."}
            </span>
          </div>
        )}

        {statusStep === "done" && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Tạo bài thi AI thành công! Đang chuyển hướng...</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Hủy
          </Button>
          <Button type="submit" size="sm" disabled={isProcessing || loadingInit}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            {isProcessing ? "Đang xử lý..." : "Sinh bài thi bằng AI"}
          </Button>
        </div>
      </form>
    </div>
  );
}
