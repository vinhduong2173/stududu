"use client";

import * as React from "react";
import { CheckCircle2, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizQuestionCard } from "@/components/features/QuizQuestionCard";
import { api, ApiError } from "@/lib/api";
import {
  AttemptResult,
  AttemptStart,
  displayIndexOfCorrect,
  formatDuration,
} from "@/lib/questionSets";

/**
 * Admin làm thử trọn bộ — điều kiện thứ hai của cửa publish (question-set-design.md mục 4).
 * Cố tình bắt Admin đi qua đúng luồng của học viên (cùng QuizQuestionCard, cùng
 * việc đảo thứ tự câu/đáp án) vì đây là thứ máy không kiểm được: đáp án đánh sai
 * vị trí, nhiễu quá dễ đoán, câu tối nghĩa.
 */
export function AdminTrial({
  setId,
  onFinished,
  onClose,
}: {
  setId: number;
  onFinished: () => void;
  onClose: () => void;
}) {
  const [attempt, setAttempt] = React.useState<AttemptStart | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [result, setResult] = React.useState<AttemptResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mỗi lần gọi tạo một lượt làm bài trong DB — chốt lại để Strict Mode ở dev không
  // đẻ ra hai lượt cho một lần Admin bấm "Làm thử"
  const startedFor = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (startedFor.current === setId) return;
    startedFor.current = setId;

    api<AttemptStart>(`/admin/question-sets/${setId}/attempt`, { method: "POST" })
      .then(setAttempt)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setId]);

  const submit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api<AttemptResult>(`/attempts/${attempt.attemptId}/submit`, {
        method: "POST",
        body: {
          answers: attempt.questions.map((q) => ({
            questionId: q.id,
            chosenIndex: answers[q.id] ?? null,
          })),
        },
      });
      setResult(res);
      onFinished();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không nộp được bài");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = attempt
    ? attempt.questions.filter((q) => answers[q.id] !== undefined).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 h-fit w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Làm thử toàn bộ</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading && <p className="py-10 text-center text-sm text-muted">Đang tải đề…</p>}

        {result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {result.correctCount}/{result.totalCount}
              </p>
              <p className="text-sm text-emerald-700">
                Thời gian: {formatDuration(result.durationSec)} — đã mở cửa publish
              </p>
            </div>
            <div className="space-y-3">
              {attempt?.questions.map((q, i) => {
                const review = result.review.find((r) => r.questionId === q.id);
                return (
                  <QuizQuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    total={attempt.questions.length}
                    mode="attempt"
                    selectedIndex={answers[q.id] ?? null}
                    revealed
                    correctIndex={displayIndexOfCorrect(q.options, review)}
                    explanation={review?.explanation ?? null}
                    disabled
                  />
                );
              })}
            </div>
            <Button className="w-full" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          attempt && (
            <>
              <p className="text-sm text-muted">
                Thứ tự câu và đáp án đã được đảo giống hệt lúc học viên làm bài.
              </p>
              <div className="space-y-3">
                {attempt.questions.map((q, i) => (
                  <QuizQuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    total={attempt.questions.length}
                    mode="attempt"
                    selectedIndex={answers[q.id] ?? null}
                    onSelect={(idx) => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                  />
                ))}
              </div>
              <div className="sticky bottom-0 -mx-6 -mb-6 rounded-b-2xl border-t border-border bg-surface p-4">
                <Button className="w-full" onClick={submit} disabled={submitting}>
                  {submitting
                    ? "Đang nộp…"
                    : `Nộp bài (${answeredCount}/${attempt.questions.length} câu đã chọn)`}
                </Button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
