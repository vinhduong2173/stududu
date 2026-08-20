"use client";

import * as React from "react";
import { Eye, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizQuestionCard } from "@/components/features/QuizQuestionCard";
import { cn } from "@/lib/utils";
import { TestQuestion } from "@/lib/questionSets";

interface QuestionListSectionProps {
  questions: TestQuestion[];
  previewMode: boolean;
  setPreviewMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  busy: boolean;
  onEdit: (q: TestQuestion, index: number) => void;
  onRemove: (questionId: number) => void;
}

export function QuestionListSection({
  questions,
  previewMode,
  setPreviewMode,
  busy,
  onEdit,
  onRemove,
}: QuestionListSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground">Câu hỏi trong bộ ({questions.length})</h2>
        {questions.length > 0 && (
          <Button variant={previewMode ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode((v) => !v)}>
            {previewMode ? (
              <>
                <PencilLine className="mr-2 h-4 w-4" /> Về chế độ soạn
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" /> Xem như học viên
              </>
            )}
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Chưa có câu hỏi nào. Tải tài liệu lên để AI sinh nháp, hoặc thêm thủ công.
        </p>
      ) : previewMode ? (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="group relative">
              <QuizQuestionCard
                question={q}
                index={i}
                total={questions.length}
                mode="preview"
                correctIndex={q.answerIndex}
                explanation={q.explanation}
              />
              <button
                onClick={() => onEdit(q, i)}
                className="absolute right-4 top-4 rounded-xl border border-border bg-surface p-2 text-muted shadow-xs transition-all hover:border-primary/40 hover:text-primary"
                title="Chỉnh sửa câu hỏi này"
              >
                <PencilLine className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{q.type}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      q.source === "ai_generated" ? "bg-violet-50 text-violet-700" : "bg-muted/10 text-muted",
                    )}
                  >
                    {q.source === "ai_generated" ? "AI sinh" : "Nhập tay"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(q, i)}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Chỉnh sửa câu hỏi & đáp án"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onRemove(q.id)}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                    title="Xoá câu hỏi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="font-medium text-foreground">{q.prompt}</p>
              <ol className="mt-2 space-y-1">
                {q.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={cn("text-sm", oi === q.answerIndex ? "font-semibold text-emerald-700" : "text-muted")}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                    {oi === q.answerIndex && " ✓"}
                  </li>
                ))}
              </ol>
              {q.explanation && <p className="mt-2 text-xs text-muted">Giải thích: {q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
