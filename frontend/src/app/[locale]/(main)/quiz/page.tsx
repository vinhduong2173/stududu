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
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6 p-4 sm:p-6 lg:p-8 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold text-foreground font-display tracking-tight">
            <GraduationCap className="h-7 w-7 text-primary" /> {t("title")}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted">{t("subtitle")}</p>
        </div>
        {quota && !quota.exempt && (
          <div
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm shadow-2xs",
              quota.remaining > 0
                ? "border-border bg-surface text-foreground"
                : "border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800/60 text-amber-800 dark:text-amber-300",
            )}
          >
            <p className="font-bold">
              {t("quota", { used: quota.used, limit: quota.limit })}
            </p>
            {quota.remaining === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">{t("quota_exhausted")}</p>
            )}
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800/60 p-3 text-sm text-rose-700 dark:text-rose-300">
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
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-3 shadow-2xs">
          <p className="font-bold text-foreground">{t("no_sets")}</p>
          <p className="mt-1 text-sm text-muted">{t("no_sets_hint")}</p>
          <div>
            <Link
              href="/community?tab=events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground text-xs transition-all shadow-xs hover:bg-primary-hover"
            >
              Đến danh sách bài test (Community Events)
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSets.map((set) => (
            <div
              key={set.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-card hover:shadow-md transition-all hover:border-primary/40"
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {set.framework} {set.level}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted font-medium">
                    {set.topic.name}
                  </span>
                  <span className="text-[11px] text-muted font-medium">{set.language.name}</span>
                </div>
                <h3 className="font-extrabold text-foreground text-base">{set.title}</h3>
                {set.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">
                    {set.description}
                  </p>
                )}
                {set.lastAttempt && (
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    {t("last_score", {
                      correct: set.lastAttempt.correctCount,
                      total: set.lastAttempt.totalCount,
                    })}
                  </p>
                )}
              </div>
              <Button asChild size="sm" className="mt-4 rounded-xl font-bold shadow-2xs cursor-pointer">
                <Link href={`/quiz/${set.id}`}>
                  {set.lastAttempt ? t("retry") : t("start")}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <section className="space-y-3 pt-4">
          <h2 className="flex items-center gap-2 font-extrabold text-foreground text-lg font-display">
            <History className="h-5 w-5 text-primary" /> {t("history")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            {history.slice(0, 10).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 text-sm last:border-b-0 hover:bg-surface-2/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground text-sm">
                    {h.set.title}
                    {h.challenge && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        <Trophy className="h-3.5 w-3.5" /> {h.challenge.title}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(h.finishedAt).toLocaleString()}
                  </p>
                </div>
                <span className="shrink-0 font-extrabold text-foreground text-sm">
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
        "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
