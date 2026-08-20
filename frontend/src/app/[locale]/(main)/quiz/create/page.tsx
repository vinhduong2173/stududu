"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Upload, ArrowLeft, Loader2, CheckCircle2, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, apiUpload, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CEFR_LEVELS } from "@/lib/questionSets";
import { Link } from "@/i18n/routing";

const INPUT_CLASS =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary shadow-xs";

export default function CreateQuizPage() {
  const t = useTranslations("quiz");
  const router = useRouter();

  const [form, setForm] = React.useState({
    framework: "CEFR",
    level: "A1",
    title: "",
    description: "",
    questionCount: 10,
    note: "",
  });

  const [file, setFile] = React.useState<File | null>(null);
  const [isCustomCount, setIsCustomCount] = React.useState(false);
  const [customCountInput, setCustomCountInput] = React.useState(15);
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
      
      const finalQuestionCount = isCustomCount ? customCountInput : form.questionCount;
      formData.append("questionCount", String(finalQuestionCount));
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
          <ArrowLeft className="h-4 w-4" /> {t("back_to_quiz_list")}
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-md shadow-primary/20 shrink-0">
            <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">{t("create_ai_title")}</h1>
            <p className="text-xs md:text-sm text-muted">{t("create_ai_subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Level & Question Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-foreground">{t("level_cefr_label")}</span>
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

            <label className="block space-y-1.5">
              <span className="block text-xs font-bold text-foreground">{t("question_count_select_label")}</span>
              <select
                className={INPUT_CLASS}
                value={isCustomCount ? -1 : form.questionCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === -1) {
                    setIsCustomCount(true);
                  } else {
                    setIsCustomCount(false);
                    setForm({ ...form, questionCount: val });
                  }
                }}
                disabled={isProcessing}
              >
                <option value={0}>{t("q_count_auto")}</option>
                <option value={5}>{t("q_count_5")}</option>
                <option value={10}>{t("q_count_10")}</option>
                <option value={15}>{t("q_count_15")}</option>
                <option value={20}>{t("q_count_20")}</option>
                <option value={30}>{t("q_count_30")}</option>
                <option value={50}>{t("q_count_50")}</option>
                <option value={-1}>{t("q_count_custom")}</option>
              </select>

              {isCustomCount && (
                <input
                  type="number"
                  min={1}
                  max={100}
                  className={cn(INPUT_CLASS, "mt-2 font-bold text-primary")}
                  placeholder={t("custom_q_count_placeholder")}
                  value={customCountInput}
                  onChange={(e) => setCustomCountInput(Math.max(1, Math.min(100, Number(e.target.value))))}
                  disabled={isProcessing}
                />
              )}
            </label>
          </div>

          {/* Title */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-foreground">{t("title_input_label")}</span>
            <input
              className={INPUT_CLASS}
              placeholder={t("title_input_placeholder")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={isProcessing}
              required
            />
          </label>

          {/* Description & Hashtags */}
          <label className="block">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Hash className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">{t("desc_input_label")}</span>
            </div>
            <textarea
              className={cn(INPUT_CLASS, "min-h-20 text-xs font-normal")}
              placeholder={t("desc_input_placeholder")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isProcessing}
            />
          </label>

          {/* Content Source */}
          <div className="space-y-3 rounded-3xl border border-dashed border-border bg-background p-5 md:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{t("content_source_label")}</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground hover:border-primary transition-colors shadow-xs">
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
                  className="text-xs font-semibold text-rose-500 hover:underline px-2"
                >
                  {t("delete_file_btn")}
                </button>
              )}
            </div>

            <div className="text-center text-xs text-muted font-medium">{t("or_paste_text")}</div>

            <textarea
              className={cn(INPUT_CLASS, "min-h-28 text-xs font-normal")}
              placeholder={t("paste_text_placeholder")}
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
                {statusStep === "creating" && t("step_creating_msg")}
                {statusStep === "generating" && t("step_generating_msg")}
                {statusStep === "importing" && t("step_importing_msg")}
                {statusStep === "publishing" && t("step_publishing_msg")}
              </span>
            </div>
          )}

          {statusStep === "done" && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{t("step_done_msg")}</span>
            </div>
          )}

          {/* Form Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => router.push("/quiz")}
              disabled={isProcessing}
            >
              {t("btn_cancel")}
            </Button>
            <Button
              type="submit"
              size="default"
              className="sd-btn-gradient px-6 py-2.5 font-extrabold rounded-2xl"
              disabled={isProcessing}
            >
              <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
              {isProcessing ? t("btn_processing") : t("btn_generate_ai")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
