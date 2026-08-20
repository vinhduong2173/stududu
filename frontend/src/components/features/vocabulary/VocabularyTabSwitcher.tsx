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
    <div className="flex items-center bg-surface p-1.5 rounded-2xl border border-border shadow-2xs">
      <button
        onClick={() => setActiveTab("quiz")}
        className={cn(
          "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          activeTab === "quiz"
            ? "bg-primary !text-white text-white shadow-2xs"
            : "text-muted hover:text-foreground hover:bg-surface-2",
        )}
      >
        <Brain className="w-4 h-4" />
        <span>{t("tab_quiz")}</span>
      </button>
      <button
        onClick={() => setActiveTab("notebook")}
        className={cn(
          "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          activeTab === "notebook"
            ? "bg-primary !text-white text-white shadow-2xs"
            : "text-muted hover:text-foreground hover:bg-surface-2",
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span>{t("tab_notebook", { count: totalCount })}</span>
      </button>
    </div>
  );
}
