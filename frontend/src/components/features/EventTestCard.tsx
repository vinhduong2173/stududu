"use client";

import * as React from "react";
import { CheckSquare, Clock, FileText, Play, Users } from "lucide-react";
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
  timePerQuestion?: string;
  takerCount?: number;
  status: "not_started" | "completed" | "in_progress";
  score?: number;
  correctCount?: number;
  totalCount?: number;
  currentQuestion?: number;
  expiryText?: string;
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
  const {
    id,
    title,
    languageCode,
    languageName,
    countryCode,
    framework,
    level,
    questionCount,
    timePerQuestion,
    takerCount = 0,
    status,
    score,
    correctCount,
    totalCount = questionCount,
    currentQuestion = 0,
    expiryText,
    href,
    onAction,
  } = item;

  const displayCountryCode =
    countryCode || COUNTRY_CODES[languageCode?.toLowerCase()] || languageCode?.substring(0, 2).toUpperCase() || "EN";

  const targetHref = href || `/quiz/${id}`;

  return (
    <div
      className={cn(
        "bg-surface border border-border/80 rounded-2xl p-5 md:p-6 shadow-2xs hover:shadow-md transition-all relative overflow-hidden",
        status === "completed" && "border-l-4 border-l-emerald-500",
        status === "in_progress" && "border-l-4 border-l-blue-600"
      )}
    >
      {/* Top Header: Title & Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-base md:text-lg text-foreground font-display leading-snug">
          {title}
        </h3>

        {status === "not_started" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex-shrink-0">
            Chưa làm
          </span>
        )}

        {status === "completed" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex-shrink-0">
            Đã hoàn thành
          </span>
        )}

        {status === "in_progress" && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex-shrink-0">
            Đang làm dở
          </span>
        )}
      </div>

      {/* Badges Row: Language & Level */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          <span className="text-[10px] font-extrabold uppercase bg-purple-200/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded">
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
          <span>{questionCount} câu</span>
        </span>

        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-primary/70" />
          <span>{timePerQuestion || "15s/câu"}</span>
        </span>

        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary/70" />
          <span>{takerCount.toLocaleString()}</span>
        </span>
      </div>

      {/* State-specific Middle Banner */}
      {status === "completed" && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl p-3 flex items-center gap-2 text-xs font-bold">
          <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Điểm của bạn:{" "}
            <span className="text-emerald-800 dark:text-emerald-200 font-extrabold text-sm ml-0.5">
              {score !== undefined ? score.toLocaleString() : `${correctCount}/${totalCount}`}
            </span>
          </span>
        </div>
      )}

      {status === "in_progress" && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Tiến độ</span>
            <span className="text-muted font-semibold">
              {currentQuestion}/{totalCount} câu
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

      {/* Card Footer: Expiry text & Action Button */}
      <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between gap-4">
        <span className="text-xs text-muted font-medium">
          {expiryText || (status === "completed" ? "Đã kết thúc" : "Còn 2 ngày")}
        </span>

        {onAction ? (
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
                ? "Xem kết quả"
                : status === "in_progress"
                ? "Tiếp tục"
                : "Bắt đầu"}
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
                ? "Xem kết quả"
                : status === "in_progress"
                ? "Tiếp tục"
                : "Bắt đầu"}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
