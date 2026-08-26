"use client";

import * as React from "react";
import { CheckSquare, Clock, FileText, Play, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export interface TestSetItem {
  id: number;
  title: string;
  languageCode: string;
  languageName: string;
  countryCode?: string;
  framework?: string;
  level: string;
  questionCount: number;
  timePerQuestionSec?: number;
  timePerQuestion?: string;
  takerCount?: number;
  status: "not_started" | "completed" | "in_progress";
  score?: number;
  correctCount?: number;
  totalCount?: number;
  currentQuestion?: number;
  diffDays?: number | null;
  expiryText?: string;
  isExpired?: boolean;
  isLimitReached?: boolean;
  isNotStarted?: boolean;
  href?: string;
  onAction?: (id: number, status: string) => void;
}

const COUNTRY_CODES: Record<string, string> = {
  en: "GB",
  ja: "JP",
  ko: "KR",
  zh: "CN",
  vi: "VN",
  fr: "FR",
  de: "DE",
  es: "ES",
};

export function EventTestCard({ item }: { item: TestSetItem }) {
  const t = useTranslations("quiz");
  const {
    id,
    title,
    languageCode,
    languageName,
    countryCode,
    framework,
    level,
    questionCount,
    timePerQuestionSec,
    timePerQuestion,
    takerCount = 0,
    status,
    score,
    correctCount,
    totalCount = questionCount,
    currentQuestion = 0,
    diffDays,
    expiryText,
    isExpired,
    isLimitReached,
    isNotStarted,
    href,
    onAction,
  } = item;

  const displayCountryCode =
    countryCode || COUNTRY_CODES[languageCode?.toLowerCase()] || languageCode?.substring(0, 2).toUpperCase() || "EN";

  const resultPageHref = `/quiz/${id}/result`;
  const defaultHref = status === "completed" ? resultPageHref : `/quiz/${id}`;
  const targetHref = href || defaultHref;

  const isBlocked = (isExpired || isLimitReached || isNotStarted) && status !== "completed";

  const formattedTimePerQ = timePerQuestionSec
    ? t("time_per_q", { sec: timePerQuestionSec })
    : timePerQuestion || t("time_per_q", { sec: 15 });

  let formattedExpiry = expiryText;
  if (diffDays && diffDays > 0) {
    formattedExpiry = t("days_left", { count: diffDays });
  } else if (!expiryText || expiryText === "Không giới hạn") {
    formattedExpiry = t("unlimited");
  } else if (expiryText === "Đã kết thúc" || isExpired) {
    formattedExpiry = t("expired");
  }

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-2xl p-5 md:p-6 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden flex flex-col justify-between",
        isBlocked && "opacity-80 bg-muted/10"
      )}
    >
      <div>
        {/* Top Header: Title & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-base md:text-lg text-foreground font-display leading-snug">
            {title}
          </h3>

          {status === "not_started" && !isBlocked && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/60 flex-shrink-0">
              {t("not_started")}
            </span>
          )}

          {status === "completed" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex-shrink-0">
              {t("completed")}
            </span>
          )}

          {status === "in_progress" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/60 flex-shrink-0">
              {t("in_progress")}
            </span>
          )}

          {isBlocked && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground flex-shrink-0">
              {isExpired ? t("expired") : isLimitReached ? t("limit_reached") : t("upcoming")}
            </span>
          )}
        </div>

        {/* Badges Row: Language & Level */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/60">
            <span className="text-[10px] font-extrabold uppercase bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded">
              {displayCountryCode}
            </span>
            <span>{languageName}</span>
          </span>

          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/40 text-muted-foreground">
            {framework ? `${framework} ${level}` : `CEFR ${level}`}
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-muted font-medium">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary/70" />
            <span>{t("questions_count", { count: questionCount })}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary/70" />
            <span>{formattedTimePerQ}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary/70" />
            <span>{takerCount.toLocaleString()}</span>
          </span>
        </div>

        {/* State-specific Middle Banner */}
        {status === "completed" && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl p-3 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {t("your_score_label")}{" "}
                <span className="text-emerald-800 dark:text-emerald-200 font-extrabold text-sm ml-0.5">
                  {score !== undefined ? score.toLocaleString() : `${correctCount}/${totalCount}`}
                </span>
              </span>
            </div>
            {correctCount !== undefined && totalCount !== undefined && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {t("correct_ratio", { correct: correctCount, total: totalCount })}
              </span>
            )}
          </div>
        )}

        {status === "in_progress" && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted font-medium">{t("progress")}</span>
              <span className="text-muted font-semibold">
                {t("correct_ratio", { correct: currentQuestion, total: totalCount })}
              </span>
            </div>
            <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(5, Math.round((currentQuestion / totalCount) * 100)))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Expiry text & Action Button */}
      <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between gap-4">
        <span className="text-xs text-muted font-medium">
          {formattedExpiry}
        </span>

        {isBlocked ? (
          <button
            disabled
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-muted text-muted-foreground cursor-not-allowed opacity-70 shadow-none"
          >
            <span>{isExpired ? t("expired") : isLimitReached ? t("limit_reached") : t("upcoming")}</span>
          </button>
        ) : onAction ? (
          <button
            onClick={() => onAction(id, status)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs",
              status === "completed"
                ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-none"
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {status !== "completed" && <Play className="w-3.5 h-3.5 fill-current" />}
            <span>
              {status === "completed"
                ? t("view_results")
                : status === "in_progress"
                ? t("resume")
                : t("start")}
            </span>
          </button>
        ) : (
          <Link
            href={targetHref}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs",
              status === "completed"
                ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-none"
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {status !== "completed" && <Play className="w-3.5 h-3.5 fill-current" />}
            <span>
              {status === "completed"
                ? t("view_results")
                : status === "in_progress"
                ? t("resume")
                : t("start")}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
