"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  RotateCcw,
  Trophy,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type LeaderboardItem = {
  rank: number;
  userId: number;
  displayName: string;
  avatarUrl?: string | null;
  correctCount: number;
  totalCount: number;
  score: number;
  durationSec: number;
};

type QuestionReviewItem = {
  questionId: number;
  prompt: string;
  term?: string | null;
  passage?: string | null;
  options: string[];
  chosenIndex: number | null;
  answerIndex: number;
  isCorrect: boolean;
  explanation?: string | null;
};

type AttemptDetailResponse = {
  attemptId: number;
  startedAt: string;
  finishedAt: string;
  durationSec: number;
  correctCount: number;
  totalCount: number;
  score: number;
  set: {
    id: number;
    title: string;
    framework: string;
    level: string;
    language: { id: number; code: string; name: string };
    topic: { id: number; name: string };
  };
  review: QuestionReviewItem[];
  myRank: number | null;
  leaderboard: LeaderboardItem[];
};

export default function QuizResultPage() {
  const t = useTranslations("quiz");
  const params = useParams();
  const search = useSearchParams();
  const setId = Number(params?.setId);
  const attemptIdParam = search.get("attemptId");

  const [data, setData] = React.useState<AttemptDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(setId)) return;
    const query = attemptIdParam ? `?attemptId=${attemptIdParam}` : "";
    api<AttemptDetailResponse>(`/question-sets/${setId}/result${query}`)
      .then(setData)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setId, attemptIdParam]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted">{t("loading_result")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Link
          href="/community?tab=events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t("back_to_events")}
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-800">{t("not_found_result")}</h2>
          <p className="text-xs text-rose-600">
            {error || t("cannot_start")}
          </p>
          <Link
            href={`/quiz/${setId}`}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
          >
            {t("start_quiz")}
          </Link>
        </div>
      </div>
    );
  }

  const { set, review, leaderboard, correctCount, totalCount, score, durationSec, myRank } = data;
  const accuracyPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/community?tab=events"
            className="p-2 rounded-xl bg-surface border border-border hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {set.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/60">
                {set.framework} {set.level}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {set.language.name} · {set.topic.name}
            </p>
          </div>
        </div>

        <Link
          href={`/quiz/${setId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground text-xs shadow-xs hover:opacity-90 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("retry_quiz")}</span>
        </Link>
      </div>

      {/* 2-COLUMN MAIN LAYOUT: Left (Results & Review), Right (Leaderboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 Cols): Summary Score & Question Review Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Score Card */}
          <div className="relative overflow-hidden bg-surface rounded-2xl border border-emerald-200 shadow-card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-foreground font-display">
                    {score.toLocaleString()}{" "}
                    <span className="text-sm font-bold text-muted uppercase">{t("points")}</span>
                  </h2>
                </div>
              </div>

              {/* Quick Stats Badges */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center min-w-[96px]">
                  <p className="text-[10px] uppercase font-bold text-muted">{t("duration_label")}</p>
                  <p className="text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{durationSec}s</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center min-w-[96px]">
                  <p className="text-[10px] uppercase font-bold text-muted">{t("rank_label")}</p>
                  <p className="text-base font-extrabold text-amber-700 mt-0.5 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>{myRank ? `#${myRank}` : "Top 10+"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Kết quả: Question-by-Question Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              {t("answer_review_title", { count: review.length })}
            </h3>

            <div className="space-y-4">
              {review.map((item, idx) => {
                const isCorrect = item.isCorrect;
                return (
                  <div
                    key={item.questionId}
                    className={cn(
                      "bg-surface rounded-2xl border p-5 md:p-6 transition-all shadow-card space-y-4 relative overflow-hidden",
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-rose-200 bg-rose-50/20"
                    )}
                  >
                    {/* Header: Question Index & Status */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {t("question_num", { n: idx + 1 })}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" /> {t("correct_badge")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <XCircle className="w-4 h-4" /> {t("wrong_badge")}
                        </span>
                      )}
                    </div>

                    {/* Term / Passage */}
                    {item.term && (
                      <p className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-3 py-1.5 rounded-lg inline-block">
                        {t("term_label", { term: item.term })}
                      </p>
                    )}
                    {item.passage && (
                      <div className="p-3 rounded-xl bg-muted/20 text-xs leading-relaxed text-foreground/80">
                        {item.passage}
                      </div>
                    )}

                    {/* Prompt */}
                    <h4 className="text-base font-bold text-foreground leading-snug">
                      {item.prompt}
                    </h4>

                    {/* Options Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {item.options.map((optText, optIdx) => {
                        const isUserChoice = item.chosenIndex === optIdx;
                        const isCorrectAnswer = item.answerIndex === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 transition-all",
                              isCorrectAnswer
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold"
                                : isUserChoice && !isCorrect
                                ? "bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200 font-bold"
                                : "bg-muted/10 border-border/60 text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-muted/30 flex items-center justify-center font-mono font-bold text-[10px]">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{optText}</span>
                            </div>

                            {isCorrectAnswer && (
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded shadow-2xs shrink-0">
                                {t("correct_answer")}
                              </span>
                            )}
                            {isUserChoice && !isCorrectAnswer && (
                              <span className="text-[10px] font-extrabold uppercase bg-rose-600 text-white px-2 py-0.5 rounded shadow-2xs shrink-0">
                                {t("user_choice")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Top 10 Leaderboard */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-surface rounded-2xl border border-border shadow-card p-6 space-y-6 overflow-hidden">
            {/* Leaderboard Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-foreground font-display leading-tight">
                    {t("leaderboard_title")}
                  </h3>
                  <p className="text-[11px] font-medium text-muted">
                    {t("leaderboard_subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* My Rank Highlight Banner */}
            {myRank && (
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                    #{myRank}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase opacity-90">{t("my_rank")}</p>
                    <p className="text-sm font-bold">{score.toLocaleString()} PTS</p>
                  </div>
                </div>
                <Award className="w-6 h-6 opacity-90" />
              </div>
            )}

            {/* Leaderboard Top 10 List */}
            <div className="space-y-2.5">
              {leaderboard.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted">{t("no_leaderboard_attempts")}</p>
              ) : (
                leaderboard.map((item) => {
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;

                  return (
                    <div
                      key={item.userId}
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs",
                        isGold && "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100",
                        isSilver && "bg-slate-500/10 border-slate-500/30 text-slate-900 dark:text-slate-100",
                        isBronze && "bg-orange-500/10 border-orange-500/30 text-orange-950 dark:text-orange-100",
                        !isGold && !isSilver && !isBronze && "bg-surface border-border/60 hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div className="shrink-0 flex items-center justify-center w-8 h-8">
                          {isGold && (
                            <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md font-mono">
                              1
                            </span>
                          )}
                          {isSilver && (
                            <span className="w-7 h-7 rounded-full bg-slate-400 text-white font-extrabold text-xs flex items-center justify-center shadow-md font-mono">
                              2
                            </span>
                          )}
                          {isBronze && (
                            <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md font-mono">
                              3
                            </span>
                          )}
                          {!isGold && !isSilver && !isBronze && (
                            <span className="text-xs font-extrabold text-muted-foreground font-mono">
                              #{item.rank}
                            </span>
                          )}
                        </div>

                        {/* User Avatar & Name */}
                        <Avatar
                          src={item.avatarUrl || undefined}
                          fallback={item.displayName.substring(0, 2).toUpperCase()}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {item.displayName}
                          </p>
                          <p className="text-[10px] font-semibold text-muted truncate">
                            {t("leaderboard_row_desc", { correct: item.correctCount, total: item.totalCount, sec: item.durationSec })}
                          </p>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-foreground font-display">
                          {item.score.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-muted block uppercase">PTS</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
