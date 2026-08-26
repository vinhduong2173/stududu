"use client";

import * as React from "react";
import { BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainTab } from "@/hooks/useVocabulary";

interface VocabularyTabSwitcherProps {
  t: any;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  totalCount: number;
}

export function VocabularyTabSwitcher({
  t,
  activeTab,
  setActiveTab,
  totalCount,
}: VocabularyTabSwitcherProps) {
  return (
    <div className="flex items-center bg-surface p-1.5 rounded-full border border-border shadow-card max-w-md mx-auto">
      <button
        type="button"
        onClick={() => setActiveTab("quiz")}
        className={cn(
          "flex-1 py-2.5 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-95",
          activeTab === "quiz"
            ? "bg-slate-900 text-white shadow-card"
            : "text-muted hover:text-foreground hover:bg-surface-2",
        )}
      >
        <Brain className="w-4 h-4 text-teal-400" />
        <span>{t("tab_quiz")}</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("notebook")}
        className={cn(
          "flex-1 py-2.5 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-95",
          activeTab === "notebook"
            ? "bg-slate-900 text-white shadow-card"
            : "text-muted hover:text-foreground hover:bg-surface-2",
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span>{t("tab_notebook", { count: totalCount })}</span>
      </button>
    </div>
  );
}
