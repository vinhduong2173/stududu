"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { QuizQuestionCard } from "@/components/features/QuizQuestionCard";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AttemptResult,
  AttemptStart,
  displayIndexOfCorrect,
  formatDuration,
} from "@/lib/questionSets";

export default function QuizAttemptPage() {
  const t = useTranslations("quiz");
  const params = useParams();
  const search = useSearchParams();
  const setId = Number(params?.setId);
  const challengeId = search.get("challengeId");

  const [attempt, setAttempt] = React.useState<AttemptStart | null>(null);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [result, setResult] = React.useState<AttemptResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mỗi lần gọi là một lượt làm bài mới trong DB, nên effect phải chạy đúng một lần
  // cho mỗi (bộ đề × thử thách). React Strict Mode ở dev gọi effect hai lần: không
  // chốt lại thì thử thách sẽ dựng ngay lỗi "chỉ được làm một lần" ở lần gọi thứ hai.
  const startedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(setId)) return;
    const key = `${setId}:${challengeId ?? ""}`;
    if (startedFor.current === key) return;
    startedFor.current = key;

    const query = challengeId ? `?challengeId=${challengeId}` : "";
    api<AttemptStart>(`/question-sets/${setId}/attempts${query}`, { method: "POST" })
      .then(setAttempt)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setId, challengeId]);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <BackLink label={t("back")} />
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error ?? t("cannot_start")}
        </p>
      </div>
    );
  }

  const answeredCount = attempt.questions.filter(
    (q) => answers[q.id] !== undefined,
  ).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-28 md:p-6">
      <BackLink label={t("back")} />

      <header className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {attempt.set.framework} {attempt.set.level}
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
            {attempt.set.topic.name}
          </span>
          {challengeId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              <Trophy className="h-3 w-3" /> {t("challenge_mode")}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold text-foreground">{attempt.set.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("question_count", { count: attempt.questions.length })}
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {result && <ResultCard result={result} t={t} />}

      <div className="space-y-3">
        {attempt.questions.map((q, i) => {
          const review = result?.review.find((r) => r.questionId === q.id);
          return (
            <QuizQuestionCard
              key={q.id}
              question={q}
              index={i}
              total={attempt.questions.length}
              mode="attempt"
              selectedIndex={answers[q.id] ?? null}
              onSelect={(idx) => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
              revealed={Boolean(result)}
              correctIndex={displayIndexOfCorrect(q.options, review)}
              explanation={review?.explanation ?? null}
              disabled={Boolean(result)}
            />
          );
        })}
      </div>

      {!result && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur md:bottom-0">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <p className="text-sm text-muted">
              {t("answered", {
                answered: answeredCount,
                total: attempt.questions.length,
              })}
            </p>
            <Button className="ml-auto" onClick={submit} disabled={submitting}>
              {submitting ? t("submitting") : t("submit")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  result,
  t,
}: {
  result: AttemptResult;
  t: ReturnType<typeof useTranslations>;
}) {
  const ratio = result.totalCount > 0 ? result.correctCount / result.totalCount : 0;
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 text-center",
        ratio >= 0.8
          ? "border-emerald-200 bg-emerald-50"
          : ratio >= 0.5
            ? "border-sky-200 bg-sky-50"
            : "border-amber-200 bg-amber-50",
      )}
    >
      <p className="text-3xl font-bold text-foreground">
        {result.correctCount}/{result.totalCount}
      </p>
      <p className="mt-1 text-sm text-muted">
        {t("duration", { time: formatDuration(result.durationSec) })}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">
        {result.levelHint === "up"
          ? t("level_up")
          : result.levelHint === "down"
            ? t("level_down")
            : t("level_stay")}
      </p>
      <p className="mt-2 text-xs text-muted">{t("review_hint")}</p>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/quiz"
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
