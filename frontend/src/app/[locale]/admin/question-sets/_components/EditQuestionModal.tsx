"use client";

import * as React from "react";
import { X, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { QUESTION_TYPES, QuestionTypeValue, TestQuestion } from "@/lib/questionSets";

const INPUT =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary font-medium";

export function EditQuestionModal({
  question,
  questionIndex,
  onClose,
  onUpdated,
}: {
  question: TestQuestion;
  questionIndex: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [type, setType] = React.useState<QuestionTypeValue>(question.type);
  const [term, setTerm] = React.useState(question.term || "");
  const [passage, setPassage] = React.useState(question.passage || "");
  const [prompt, setPrompt] = React.useState(question.prompt || "");
  const [options, setOptions] = React.useState<string[]>(
    question.options && question.options.length >= 4
      ? [...question.options]
      : ["", "", "", ""]
  );
  const [answerIndex, setAnswerIndex] = React.useState(question.answerIndex ?? 0);
  const [explanation, setExplanation] = React.useState(question.explanation || "");
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const needsTerm = type === "vocabulary";
  const needsPassage = type === "cloze" || type === "reading";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      await api(`/admin/questions/${question.id}`, {
        method: "PATCH",
        body: {
          type,
          term: needsTerm ? term : undefined,
          passage: needsPassage ? passage : undefined,
          prompt,
          options,
          answerIndex,
          explanation: explanation || undefined,
        },
      });
      onUpdated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.message.split(", "));
      } else {
        setErrors(["Không cập nhật được câu hỏi"]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-xs p-4">
      <form
        onSubmit={submit}
        className="my-8 h-fit max-h-[90vh] overflow-y-auto w-full max-w-xl space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <PencilLine className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Chỉnh sửa câu hỏi #{questionIndex + 1}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted uppercase">Loại câu hỏi</span>
            <select
              className={INPUT}
              value={type}
              onChange={(e) => setType(e.target.value as QuestionTypeValue)}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {needsTerm && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted uppercase">Từ vựng gốc / Term</span>
              <input
                className={INPUT}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Ví dụ: Battery"
              />
            </label>
          )}
        </div>

        {needsPassage && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted uppercase">Đoạn văn đọc hiểu</span>
            <textarea
              className={cn(INPUT, "min-h-24 leading-relaxed")}
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="Nhập đoạn văn cho câu đọc hiểu..."
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted uppercase">Đề bài / Câu hỏi</span>
          <textarea
            className={cn(INPUT, "min-h-20 leading-relaxed")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            placeholder="Nhập nội dung câu hỏi..."
          />
        </label>

        <div className="space-y-2.5 rounded-2xl border border-border/80 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
              4 Đáp án & Đáp án đúng
            </span>
            <span className="text-[11px] font-semibold text-muted">
              Đánh dấu radio chọn câu trả lời đúng
            </span>
          </div>

          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="editAnswerIndex"
                  checked={answerIndex === i}
                  onChange={() => setAnswerIndex(i)}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <span className="w-5 text-xs font-extrabold text-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
              </label>
              <input
                className={cn(
                  INPUT,
                  answerIndex === i && "border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-950 dark:text-emerald-100"
                )}
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                required
              />
            </div>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted uppercase">
            Giải thích chi tiết <span className="font-normal text-muted/70">(tùy chọn)</span>
          </span>
          <textarea
            className={cn(INPUT, "min-h-20 leading-relaxed")}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Nhập phần giải thích cho câu hỏi..."
          />
        </label>

        {errors.length > 0 && (
          <ul className="list-inside list-disc rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-semibold">
            Hủy
          </Button>
          <Button type="submit" size="sm" disabled={saving} className="bg-primary text-primary-foreground font-bold rounded-xl px-5">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
