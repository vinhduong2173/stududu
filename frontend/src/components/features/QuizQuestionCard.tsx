"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Component câu hỏi DÙNG CHUNG giữa màn làm bài của học viên và chế độ
 * "👁 Xem như học viên" của Admin — question-set-ai-generation-addendum.md mục 4.
 *
 * Dùng chung là có chủ đích: nếu Admin xem một component khác thì việc xem trước
 * không còn bắt được lỗi trình bày (câu quá dài bị cắt, layout vỡ trên mobile).
 *
 * `mode="preview"` chỉ tắt việc gọi API chấm điểm — CSS và cách render giữ nguyên.
 * BR-50: ở preview KHÔNG đảo thứ tự đáp án, Admin cần thấy đúng thứ tự đã nhập.
 */

export type QuizQuestion = {
  id: number;
  type: string;
  term?: string | null;
  passage?: string | null;
  prompt: string;
  options: string[];
};

/** Loại câu có khoá dịch riêng; loại lạ thì hiện thẳng giá trị thô */
const TRANSLATED_TYPES = ["vocabulary", "grammar", "cloze", "reading"];

export type QuizQuestionCardProps = {
  question: QuizQuestion;
  /** Vị trí hiển thị (bắt đầu từ 0) */
  index: number;
  total?: number;
  mode?: "attempt" | "preview";
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
  /** Đã chấm xong: tô màu đúng/sai và hiện giải thích */
  revealed?: boolean;
  correctIndex?: number | null;
  explanation?: string | null;
  disabled?: boolean;
};

export function QuizQuestionCard({
  question,
  index,
  total,
  mode = "attempt",
  selectedIndex = null,
  onSelect,
  revealed = false,
  correctIndex = null,
  explanation = null,
  disabled = false,
}: QuizQuestionCardProps) {
  const t = useTranslations("quiz");
  // Ở preview, Admin bấm thử để xem đáp án — không gọi API chấm điểm
  const [previewPick, setPreviewPick] = React.useState<number | null>(null);
  const isPreview = mode === "preview";

  const activePick = isPreview ? previewPick : selectedIndex;
  const showResult = isPreview ? previewPick !== null : revealed;

  const handlePick = (i: number) => {
    if (disabled) return;
    if (isPreview) {
      setPreviewPick((prev) => (prev === i ? null : i));
      return;
    }
    if (revealed) return;
    onSelect?.(i);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
          {index + 1}
          {total ? `/${total}` : ""}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
          {TRANSLATED_TYPES.includes(question.type)
            ? t(`type_${question.type}` as "type_vocabulary")
            : question.type}
        </span>
        {question.term && (
          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
            {question.term}
          </span>
        )}
      </div>

      {question.passage && (
        <p className="mb-3 whitespace-pre-wrap rounded-xl bg-muted/10 p-3 text-sm leading-relaxed text-foreground/90">
          {question.passage}
        </p>
      )}

      <p className="mb-4 text-base font-semibold leading-relaxed text-foreground">
        {question.prompt}
      </p>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const picked = activePick === i;
          const isCorrect = correctIndex === i;
          const markCorrect = showResult && isCorrect;
          const markWrong = showResult && picked && !isCorrect;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePick(i)}
              disabled={disabled}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-70",
                markCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : markWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900"
                    : picked
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background hover:bg-muted/10",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  markCorrect
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : markWrong
                      ? "border-rose-500 bg-rose-500 text-white"
                      : picked
                        ? "border-primary bg-primary text-white"
                        : "border-border text-muted",
                )}
              >
                {markCorrect ? (
                  <Check className="h-3.5 w-3.5" />
                ) : markWrong ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="flex-1 break-words">{option}</span>
            </button>
          );
        })}
      </div>

      {showResult && explanation && (
        <p className="mt-3 rounded-xl border border-border bg-muted/5 p-3 text-sm text-muted">
          <span className="font-semibold text-foreground">
            {t("explanation_label")}{" "}
          </span>
          {explanation}
        </p>
      )}

      {isPreview && previewPick === null && (
        <p className="mt-3 text-xs text-muted">{t("preview_hint")}</p>
      )}
    </div>
  );
}
