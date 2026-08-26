"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { QuizQuestionCard } from "@/components/features/QuizQuestionCard";
import { KahootQuizEngine } from "@/components/features/KahootQuizEngine";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AttemptResult,
  AttemptStart,
  displayIndexOfCorrect,
  formatDuration,
} from "@/lib/questionSets";

import { useRouter } from "next/navigation";

export default function QuizAttemptPage() {
  const t = useTranslations("quiz");
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const setId = Number(params?.setId);
  const challengeId = search.get("challengeId");

  const [attempt, setAttempt] = React.useState<AttemptStart | null>(null);
  const [result, setResult] = React.useState<AttemptResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(setId)) return;
    const key = `${setId}:${challengeId ?? ""}`;
    if (startedFor.current === key) return;
    startedFor.current = key;

    const query = challengeId ? `?challengeId=${challengeId}` : "";
    api<AttemptStart>(`/question-sets/${setId}/attempts${query}`, { method: "POST" })
      .then((data) => {
        if (typeof window !== "undefined") {
          const localStr = localStorage.getItem("stududu_custom_quiz_sets");
          if (localStr) {
            try {
              const list = JSON.parse(localStr);
              const found = list.find(
                (item: any) =>
                  String(item.id) === String(setId) ||
                  item.title?.toLowerCase() === data.set.title?.toLowerCase()
              );
              if (found && found.timePerQuestionSec) {
                data.set.timePerQuestionSec = found.timePerQuestionSec;
              }
            } catch {
              // ignore
            }
          }
        }
        setAttempt(data);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setId, challengeId]);

  const handleCompleteAttempt = async (
    userAnswers: Record<number, number>,
    liveScore?: number
  ) => {
    if (!attempt) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api<AttemptResult>(`/attempts/${attempt.attemptId}/submit`, {
        method: "POST",
        body: {
          answers: attempt.questions.map((q) => ({
            questionId: q.id,
            chosenIndex: userAnswers[q.id] ?? null,
          })),
          score: liveScore,
        },
      });
      router.push(`/quiz/${setId}/result?attemptId=${attempt.attemptId}`);
      return res;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Link
          href="/community?tab=events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài test
        </Link>
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-semibold">
          {error ?? t("cannot_start")}
        </p>
      </div>
    );
  }

  return (
    <KahootQuizEngine
      attempt={attempt}
      onComplete={handleCompleteAttempt}
      submitting={submitting}
      result={result}
    />
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

      <div className="mt-5 pt-4 border-t border-border/40 flex justify-center">
        <Link
          href="/community?tab=events"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground text-xs transition-all shadow-xs hover:opacity-90"
        >
          Quay lại danh sách bài test
        </Link>
      </div>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/community?tab=events"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
