"use client";

import * as React from "react";
import { X, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { QUESTION_TYPES, QuestionTypeValue } from "@/lib/questionSets";

const INPUT =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

/**
 * Form nhập tay 1 câu — lối CỨU HỘ khi AI lỗi/hết quota/chất lượng quá kém
 * (question-set-ai-only-flow.md mục 5).
 *
 * Cố tình KHÔNG có nút "Thêm và nhập câu tiếp": nhập tay hơi chậm là có chủ đích.
 * Nhập tay quá 5 câu liên tục là dấu hiệu AI đang có vấn đề cần báo cáo,
 * không phải kênh nhập chính (BR-56).
 */
export function ManualQuestionForm({
  setId,
  onClose,
  onAdded,
}: {
  setId: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [type, setType] = React.useState<QuestionTypeValue>("vocabulary");
  const [term, setTerm] = React.useState("");
  const [passage, setPassage] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [options, setOptions] = React.useState(["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = React.useState(0);
  const [explanation, setExplanation] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const needsTerm = type === "vocabulary";
  const needsPassage = type === "cloze" || type === "reading";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      // Đi qua ĐÚNG hàm validate của backend như câu AI sinh — BR-55
      await api(`/admin/question-sets/${setId}/questions`, {
        method: "POST",
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
      onAdded();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.message.split(", "));
      } else {
        setErrors(["Không thêm được câu hỏi"]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="my-8 h-fit w-full max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <PencilLine className="w-5 h-5 text-primary" />
            <span>Thêm câu thủ công</span>
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="rounded-xl border border-border bg-muted/5 p-3 text-xs text-muted">
          Form này để <strong>cứu hộ</strong>: bổ sung 1–2 câu cho đủ bộ, hoặc thay
          một câu AI hiểu sai. Nếu bạn phải nhập tay quá 5 câu liên tục, hãy báo
          lại — nhiều khả năng AI đang có vấn đề.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Loại câu</span>
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
            <span className="mb-1 block text-xs font-semibold text-muted">Từ vựng gốc</span>
            <input className={INPUT} value={term} onChange={(e) => setTerm(e.target.value)} />
          </label>
        )}

        {needsPassage && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Đoạn văn</span>
            <textarea
              className={cn(INPUT, "min-h-24")}
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Câu hỏi</span>
          <textarea
            className={cn(INPUT, "min-h-20")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </label>

        <div className="space-y-2">
          <span className="block text-xs font-semibold text-muted">
            4 đáp án — chọn ô tròn để đánh dấu đáp án đúng
          </span>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="answerIndex"
                checked={answerIndex === i}
                onChange={() => setAnswerIndex(i)}
                className="h-4 w-4 accent-primary"
              />
              <span className="w-5 text-xs font-bold text-muted">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                className={INPUT}
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                required
              />
            </div>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">
            Giải thích (không bắt buộc)
          </span>
          <textarea
            className={cn(INPUT, "min-h-16")}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </label>

        {errors.length > 0 && (
          <ul className="list-inside list-disc rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Đang thêm…" : "Thêm vào bộ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
