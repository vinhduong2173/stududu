"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Upload, X, FileText, Loader2, CheckCircle2, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, apiUpload, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CEFR_LEVELS } from "@/lib/questionSets";

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary";

export function CreateUserSetModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (newSetId: number) => void;
}) {
  const t = useTranslations("quiz");
  const [form, setForm] = React.useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError(t("err_missing_title"));
      return;
    }
    if (!file && !form.note.trim()) {
      setError(t("err_missing_content"));
      return;
    }

    try {
      // Step 1: Create Set shell
      setStatusStep("creating");
      const createdSet = await api<{ id: number }>("/question-sets/user-create", {
        method: "POST",
        body: {
          languageId: 1,
          topicId: 1,
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

      const dryRun = await apiUpload<{
        rows: { valid: boolean; question: any }[];
        sourceMeta: any;
      }>(`/question-sets/${createdSet.id}/user-generate`, formData);

      const validQuestions = dryRun.rows.filter((r) => r.valid && r.question).map((r) => r.question);
      if (validQuestions.length === 0) {
        throw new Error(t("err_ai_empty"));
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
              <h2 className="text-lg font-bold text-foreground">{t("create_ai_title")}</h2>
              <p className="text-xs text-muted">{t("create_ai_subtitle")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t("level_cefr_label")}</span>
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
            <span className="mb-1 block text-xs font-semibold text-muted">{t("question_count_select_label")}</span>
            <select
              className={INPUT_CLASS}
              value={form.questionCount}
              onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) })}
              disabled={isProcessing}
            >
              <option value={5}>{t("q_count_5")}</option>
              <option value={10}>{t("q_count_10")}</option>
              <option value={15}>{t("q_count_15")}</option>
              <option value={20}>{t("q_count_20")}</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("title_input_label")}</span>
          <input
            className={INPUT_CLASS}
            placeholder={t("title_input_placeholder")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={isProcessing}
            required
          />
        </label>

        <label className="block">
          <div className="flex items-center gap-1 mb-1">
            <Hash className="h-3 w-3 text-primary" />
            <span className="text-xs font-semibold text-muted">{t("desc_input_label")}</span>
          </div>
          <textarea
            className={cn(INPUT_CLASS, "min-h-16 text-xs")}
            placeholder={t("desc_input_placeholder")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isProcessing}
          />
        </label>

        <div className="space-y-2 rounded-2xl border border-dashed border-border bg-background p-4">
          <span className="block text-xs font-semibold text-foreground">{t("content_source_label")}</span>
          
          <div className="flex items-center gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/10">
              <Upload className="h-4 w-4 text-primary" />
              {file ? file.name : t("upload_file_btn")}
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
                {t("delete_file_btn")}
              </button>
            )}
          </div>

          <span className="block text-center text-xs text-muted">{t("or_paste_text")}</span>

          <textarea
            className={cn(INPUT_CLASS, "min-h-20 text-xs")}
            placeholder={t("paste_text_placeholder")}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={isProcessing}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs font-medium text-primary">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>
              {statusStep === "creating" && t("step_creating_msg")}
              {statusStep === "generating" && t("step_generating_msg")}
              {statusStep === "importing" && t("step_importing_msg")}
              {statusStep === "publishing" && t("step_publishing_msg")}
            </span>
          </div>
        )}

        {statusStep === "done" && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t("step_done_msg")}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            {t("btn_cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={isProcessing}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            {isProcessing ? t("btn_processing") : t("btn_generate_ai")}
          </Button>
        </div>
      </form>
    </div>
  );
}
