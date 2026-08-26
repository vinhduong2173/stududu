import * as React from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VocabRow } from "@/hooks/useQuizCreateWizard";
import { QuestionCardItem } from "./QuestionCardItem";

interface Step3DataPreviewTableProps {
  rows: VocabRow[];
  uploadedFileName?: string;
  onUpdateRow: (index: number, updated: Partial<VocabRow>) => void;
  onDeleteRow: (index: number) => void;
  onAddRow: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Step3DataPreviewTable({
  rows,
  uploadedFileName,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
  onPrev,
  onNext,
}: Step3DataPreviewTableProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Bước 3 — Chỉnh sửa &amp; Kiểm tra câu hỏi
          </h2>
          <p className="mt-1 text-sm text-muted">
            Dữ liệu trích xuất từ <strong>{uploadedFileName || "tệp đã tải lên"}</strong>.
            Bạn có thể chỉnh sửa trực tiếp nội dung câu hỏi và 4 đáp án bên dưới.
          </p>
        </div>
        <span className="self-start rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 sm:self-auto shrink-0">
          {rows.length} câu hỏi
        </span>
      </div>

      {/* Empty State */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          Chưa có dữ liệu câu hỏi nào. Vui lòng quay lại <strong>Bước 2</strong> để tải file lên hoặc bấm Thêm câu hỏi bên dưới.
        </div>
      ) : (
        /* Google Form Style Questions List */
        <div className="space-y-4">
          {rows.map((row, index) => (
            <QuestionCardItem
              key={row.id || index}
              row={row}
              index={index}
              onUpdate={(updated) => onUpdateRow(index, updated)}
              onDelete={() => onDeleteRow(index)}
            />
          ))}
        </div>
      )}

      {/* Add question button */}
      <button
        type="button"
        onClick={onAddRow}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="h-4 w-4" /> Thêm câu hỏi mới
      </button>

      {/* Navigation Footer */}
      <div className="flex justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <Button variant="outline" onClick={onPrev} className="rounded-xl px-5">
          ← Quay lại
        </Button>
        <Button
          disabled={rows.length === 0}
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-xs disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> Chuyển sang Phát hành ({rows.length} câu) →
        </Button>
      </div>
    </div>
  );
}
