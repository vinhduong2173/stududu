"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Trophy, Zap, CheckCircle2, Award, RotateCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizCompletedViewProps {
  t: any;
  rankInfo: { title: string; color: string };
  totalQuestions: number;
  earnedPoints: number;
  maxPossiblePoints: number;
  score: number;
  accuracyPercent: number;
  handleRestartQuiz: () => void;
  setActiveTab: (tab: "quiz" | "notebook") => void;
}

export function QuizCompletedView({
  t,
  rankInfo,
  totalQuestions,
  earnedPoints,
  maxPossiblePoints,
  score,
  accuracyPercent,
  handleRestartQuiz,
  setActiveTab,
}: QuizCompletedViewProps) {
  return (
    <div className="rounded-3xl bg-surface border-2 border-border shadow-xl p-6 md:p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg text-amber-950">
        <Trophy className="w-12 h-12 animate-bounce" />
      </div>

      <div className="space-y-1">
        <span className={cn("inline-block px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider mb-2", rankInfo.color)}>
          {rankInfo.title}
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-foreground">
          {t("quiz_result_title")}
        </h2>
        <p className="text-sm text-muted">
          {t("quiz_result_desc", { count: totalQuestions })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2">
        <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 p-5 rounded-2xl text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-primary text-xs font-bold uppercase mb-1">
            <Zap className="w-3.5 h-3.5" /> {t("total_score")}
          </div>
          <div className="text-3xl font-black text-primary">
            {earnedPoints} <span className="text-xs text-muted font-normal">/ {maxPossiblePoints}</span>
          </div>
          <div className="text-[11px] text-muted mt-1 font-semibold">{t("score_sub")}</div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t("correct_answers")}
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {score} <span className="text-xs text-muted font-normal">/ {totalQuestions}</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-semibold">
            {t("correct_sub")}
          </div>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-1">
            <Award className="w-3.5 h-3.5" /> {t("accuracy_rate")}
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {accuracyPercent}%
          </div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 font-semibold">
            {t("accuracy")}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button
          onClick={handleRestartQuiz}
          className="rounded-2xl h-12 px-6 font-bold shadow-md bg-primary text-primary-foreground hover:opacity-90"
        >
          <RotateCw className="w-4 h-4 mr-2" /> {t("btn_new_quiz")}
        </Button>
        <Button
          onClick={() => setActiveTab("notebook")}
          variant="outline"
          className="rounded-2xl h-12 px-6 font-bold border-border"
        >
          <BookOpen className="w-4 h-4 mr-2" /> {t("btn_view_notebook")}
        </Button>
      </div>
    </div>
  );
}
