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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-card">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-display tracking-tight">
          {t("page_title")}
        </h1>
        <p className="text-xs md:text-sm text-muted mt-1">{t("page_subtitle")}</p>
      </div>

      {/* TOP RIGHT STATS COUNTERS */}
      <div className="flex items-center gap-2.5 self-start md:self-auto">
        <div className="bg-slate-100/80 border border-slate-200/90 rounded-xl px-4 py-2 text-center min-w-[80px] shadow-2xs">
          <div className="text-xl font-extrabold text-slate-900">{totalCount}</div>
          <div className="text-[11px] font-bold text-slate-600">{t("total_words")}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl px-4 py-2 text-center min-w-[80px] shadow-2xs">
          <div className="text-xl font-extrabold text-emerald-700">
            {masteredCount}
          </div>
          <div className="text-[11px] font-bold text-emerald-700">
            {t("mastered")}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl px-4 py-2 text-center min-w-[80px] shadow-2xs">
          <div className="text-xl font-extrabold text-amber-700">
            {learningCount}
          </div>
          <div className="text-[11px] font-bold text-amber-700">
            {t("need_review")}
          </div>
        </div>
      </div>
    </div>
  );
}
