"use client";

import * as React from "react";
import { GraduationCap, History, Loader2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AttemptHistoryItem,
  DailyQuota,
  LearnerSet,
  VocabTopic,
} from "@/lib/questionSets";

export default function QuizListPage() {
  const t = useTranslations("quiz");
  const [sets, setSets] = React.useState<LearnerSet[]>([]);
  const [quota, setQuota] = React.useState<DailyQuota | null>(null);
  const [topics, setTopics] = React.useState<VocabTopic[]>([]);
  const [history, setHistory] = React.useState<AttemptHistoryItem[]>([]);
  const [topicId, setTopicId] = React.useState<number | "all">("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      api<LearnerSet[]>("/question-sets"),
      api<DailyQuota>("/question-sets/quota"),
      api<VocabTopic[]>("/question-sets/topics"),
      api<AttemptHistoryItem[]>("/question-sets/history"),
    ])
      .then(([s, q, tp, h]) => {
        setSets(s);
        setQuota(q);
        setTopics(tp);
        setHistory(h);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleSets =
    topicId === "all" ? sets : sets.filter((s) => s.topic.id === topicId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <GraduationCap className="h-6 w-6 text-primary" /> {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        {quota && !quota.exempt && (
          <div
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm",
              quota.remaining > 0
                ? "border-border bg-surface text-foreground"
                : "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            <p className="font-semibold">
              {t("quota", { used: quota.used, limit: quota.limit })}
            </p>
            {quota.remaining === 0 && (
              <p className="text-xs">{t("quota_exhausted")}</p>
            )}
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={topicId === "all"} onClick={() => setTopicId("all")}>
            {t("all_topics")}
          </FilterChip>
          {topics.map((tp) => (
            <FilterChip
              key={tp.id}
              active={topicId === tp.id}
              onClick={() => setTopicId(tp.id)}
            >
              {tp.name}
            </FilterChip>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visibleSets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-semibold text-foreground">{t("no_sets")}</p>
          <p className="mt-1 text-sm text-muted">{t("no_sets_hint")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleSets.map((set) => (
            <div
              key={set.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5"
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {set.framework} {set.level}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
                    {set.topic.name}
                  </span>
                  <span className="text-xs text-muted">{set.language.name}</span>
                </div>
                <h3 className="font-bold text-foreground">{set.title}</h3>
                {set.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {set.description}
                  </p>
                )}
                {set.lastAttempt && (
                  <p className="mt-2 text-xs text-emerald-700">
                    {t("last_score", {
                      correct: set.lastAttempt.correctCount,
                      total: set.lastAttempt.totalCount,
                    })}
                  </p>
                )}
              </div>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/quiz/${set.id}`}>
                  {set.lastAttempt ? t("retry") : t("start")}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <History className="h-4 w-4" /> {t("history")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {history.slice(0, 10).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {h.set.title}
                    {h.challenge && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                        <Trophy className="h-3 w-3" /> {h.challenge.title}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(h.finishedAt).toLocaleString()}
                  </p>
                </div>
                <span className="shrink-0 font-bold text-foreground">
                  {h.correctCount}/{h.totalCount}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-muted hover:bg-muted/10",
      )}
    >
      {children}
    </button>
  );
}
