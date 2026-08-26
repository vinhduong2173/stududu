"use client";

import * as React from "react";

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 sm:p-7 rounded-3xl border border-border shadow-card">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-foreground font-display tracking-tight">
          {t("page_title")}
        </h1>
        <p className="text-xs md:text-sm text-muted mt-1 leading-relaxed">{t("page_subtitle")}</p>
      </div>

      {/* Top Right Stats Counters */}
      <div className="flex items-center gap-2.5 self-start md:self-auto">
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2.5 text-center min-w-[85px] shadow-2xs">
          <div className="text-xl font-extrabold text-slate-900">{totalCount}</div>
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{t("total_words")}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl px-4 py-2.5 text-center min-w-[85px] shadow-2xs">
          <div className="text-xl font-extrabold text-emerald-800">{masteredCount}</div>
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{t("mastered")}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl px-4 py-2.5 text-center min-w-[85px] shadow-2xs">
          <div className="text-xl font-extrabold text-amber-800">{learningCount}</div>
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">{t("need_review")}</div>
        </div>
      </div>
    </div>
  );
}
