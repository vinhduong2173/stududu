import * as React from "react";
import { Trash2 } from "lucide-react";
import { VocabRow } from "@/hooks/useQuizCreateWizard";
import { QuestionOptionItem } from "./QuestionOptionItem";

interface QuestionCardItemProps {
  row: VocabRow;
  index: number;
  onUpdate: (updated: Partial<VocabRow>) => void;
  onDelete: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuestionCardItem({
  row,
  index,
  onUpdate,
  onDelete,
}: QuestionCardItemProps) {
  const options = React.useMemo(() => {
    if (row.options && row.options.length === 4) return row.options;
    return [row.meaning, ...(row.distractors || []).slice(0, 3)];
  }, [row.options, row.meaning, row.distractors]);

  const correctIndex = row.correctIndex !== undefined ? row.correctIndex : 0;

  // Track which options are hidden (default: all visible)
  const hiddenOptions = row.hiddenOptions || [false, false, false, false];

  // Count visible options
  const visibleCount = hiddenOptions.filter((h) => !h).length;

  const handleOptionTextChange = (optIdx: number, newText: string) => {
    const nextOptions = [...options];
    nextOptions[optIdx] = newText;

    const nextDistractors = nextOptions.filter((_, i) => i !== correctIndex);
    onUpdate({
      options: nextOptions,
      meaning: nextOptions[correctIndex],
      distractors: nextDistractors,
    });
  };

  const handleSetCorrect = (optIdx: number) => {
    if (hiddenOptions[optIdx]) return;
    const nextDistractors = options.filter((_, i) => i !== optIdx);
    onUpdate({
      correctIndex: optIdx,
      meaning: options[optIdx],
      distractors: nextDistractors,
    });
  };

  const handleToggleHidden = (optIdx: number) => {
    const nextHidden = [...hiddenOptions];
    const isCurrentlyHidden = nextHidden[optIdx];

    // Prevent hiding if only 2 visible remain
    if (!isCurrentlyHidden && visibleCount <= 2) return;

    // Prevent hiding the correct answer
    if (!isCurrentlyHidden && optIdx === correctIndex) return;

    nextHidden[optIdx] = !isCurrentlyHidden;
    onUpdate({ hiddenOptions: nextHidden });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-md md:p-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Câu hỏi #{index + 1}
          </span>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Xóa câu hỏi này"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Question Prompt Input */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
          Nội dung câu hỏi <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={row.word}
          onChange={(e) => onUpdate({ word: e.target.value })}
          placeholder="Nhập nội dung câu hỏi hoặc từ vựng..."
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Options with radio + eye toggle */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Các phương án ({visibleCount} hiện / {4 - visibleCount} ẩn)
          </label>
          <span className="text-[11px] font-medium text-emerald-600">
            Đáp án đúng: <strong>Phương án {OPTION_LABELS[correctIndex]}</strong>
          </span>
        </div>

        {OPTION_LABELS.map((label, optIdx) => (
          <QuestionOptionItem
            key={optIdx}
            label={label}
            isCorrect={optIdx === correctIndex}
            isHidden={!!hiddenOptions[optIdx]}
            value={options[optIdx] || ""}
            canHide={optIdx !== correctIndex && (!!hiddenOptions[optIdx] || visibleCount > 2)}
            onChange={(val) => handleOptionTextChange(optIdx, val)}
            onSetCorrect={() => handleSetCorrect(optIdx)}
            onToggleHidden={() => handleToggleHidden(optIdx)}
          />
        ))}
      </div>
    </div>
  );
}
