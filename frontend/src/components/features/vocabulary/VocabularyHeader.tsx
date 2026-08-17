"use client";

import * as React from "react";
import { BookOpen, Sparkles } from "lucide-react";

interface VocabularyHeaderProps {
  t: any;
  totalCount: number;
  masteredCount: number;
  learningCount: number;
  onOpenAiModal?: () => void;
}

export function VocabularyHeader({
  t,
  totalCount,
  masteredCount,
  learningCount,
  onOpenAiModal,
}: VocabularyHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
          <BookOpen className="w-4 h-4" /> {t("header_badge")}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {t("page_title")}
        </h1>
        <p className="text-sm text-muted mt-1">{t("page_subtitle")}</p>
      </div>

      {/* TOP RIGHT STATS COUNTERS & CREATE AI QUIZ BUTTON */}
      <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
        {onOpenAiModal && (
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>Tạo đề AI</span>
          </button>
        )}
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
