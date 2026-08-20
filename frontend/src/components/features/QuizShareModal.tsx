"use client";

import * as React from "react";
import { Sparkles, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { LearnerSet } from "@/lib/questionSets";

export function QuizShareModal({
  open,
  onClose,
  onSendQuiz,
  partnerName,
}: {
  open: boolean;
  onClose: () => void;
  onSendQuiz: (quiz: { id: number; title: string; level: string; questionCount: number }) => void;
  partnerName: string;
}) {
  const [sets, setSets] = React.useState<LearnerSet[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    api<LearnerSet[]>("/question-sets")
      .then(setSets)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Gửi đề thi cho {partnerName}</h3>
              <p className="text-xs text-muted">Chọn một bài thi trắc nghiệm để thách đấu / ôn tập cùng nhau</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sets.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">Chưa có bài thi nào. Hãy tạo bài thi AI trước nhé!</div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {sets.map((set) => (
              <div
                key={set.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3.5 hover:border-primary/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {set.framework} {set.level}
                    </span>
                    <span className="text-[11px] text-muted truncate">{set.topic.name}</span>
                  </div>
                  <h4 className="font-bold text-xs text-foreground truncate">{set.title}</h4>
                </div>
                <Button
                  size="sm"
                  className="sd-btn-gradient text-xs gap-1 py-1.5 px-3 rounded-xl shrink-0"
                  onClick={() => {
                    onSendQuiz({
                      id: set.id,
                      title: set.title,
                      level: `${set.framework} ${set.level}`,
                      questionCount: set.questionCount || set._count?.questions || 10,
                    });
                    onClose();
                  }}
                >
                  <Send className="h-3 w-3" /> Gửi
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
