"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";

interface VocabularyHeaderProps {
  t: any;
  totalCount: number;
  masteredCount: number;
  learningCount: number;
}

export function VocabularyHeader({
  t,
  totalCount,
  masteredCount,
  learningCount,
}: VocabularyHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
          <BookOpen className="w-4 h-4" /> {t("header_badge")}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {t("page_title")}
        </h1>
        <p className="text-sm text-muted mt-1">{t("page_subtitle")}</p>
      </div>

      {/* TOP RIGHT STATS COUNTERS */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        <div className="bg-muted/10 border border-border rounded-2xl px-5 py-3 text-center min-w-[84px]">
          <div className="text-2xl font-black text-foreground">{totalCount}</div>
          <div className="text-[11px] font-semibold text-muted">{t("total_words")}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 text-center min-w-[84px]">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {masteredCount}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {t("mastered")}
          </div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-3 text-center min-w-[84px]">
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {learningCount}
          </div>
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {t("need_review")}
          </div>
        </div>
      </div>
    </div>
  );
}
