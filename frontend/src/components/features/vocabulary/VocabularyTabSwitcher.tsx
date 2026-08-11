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
    <div className="flex items-center bg-surface p-1.5 rounded-2xl border border-border shadow-sm">
      <button
        onClick={() => setActiveTab("quiz")}
        className={cn(
          "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
          activeTab === "quiz"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted hover:text-foreground hover:bg-muted/10",
        )}
      >
        <Brain className="w-4 h-4" /> 🎯 {t("tab_quiz")}
      </button>
      <button
        onClick={() => setActiveTab("notebook")}
        className={cn(
          "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
          activeTab === "notebook"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted hover:text-foreground hover:bg-muted/10",
        )}
      >
        <BookOpen className="w-4 h-4" /> 📚 {t("tab_notebook", { count: totalCount })}
      </button>
    </div>
  );
}
