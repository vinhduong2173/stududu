"use client";

import * as React from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { QuotaChip } from "@/components/ui/QuotaChip";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Link } from "@/i18n/routing";

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
  // EP-11 — trần sổ từ vựng (SRS §3.2). Chỉ hiện con số; chức năng ôn tập vẫn
  // đầy đủ ở mọi gói, và BR-43 bảo đảm từ đã lưu không bao giờ bị xoá.
  const { entitlement } = useEntitlements();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-card">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
          <BookOpen className="w-4 h-4" /> {t("header_badge")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {t("page_title")}
          </h1>
          <QuotaChip entitlement={entitlement("vocabulary.save")} />
        </div>
        <p className="text-sm text-muted mt-1">{t("page_subtitle")}</p>
      </div>

      {/* TOP RIGHT STATS COUNTERS & CREATE AI QUIZ BUTTON */}
      <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
        <Link
          href="/quiz/create"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
          <span>Tạo đề AI</span>
        </Link>
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
