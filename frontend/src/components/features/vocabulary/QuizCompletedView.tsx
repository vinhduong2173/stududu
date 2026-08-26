"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Trophy, Zap, CheckCircle2, Award, RotateCw, BookOpen, Volume2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavedWord } from "@/components/features/WordSaveModal";
import { speakWord } from "@/hooks/useVocabulary";

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
  incorrectWords?: SavedWord[];
  handleRetryMissed?: () => void;
  getDefinitionForTargetLang?: (word: SavedWord) => string;
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
  incorrectWords = [],
  handleRetryMissed,
  getDefinitionForTargetLang,
}: QuizCompletedViewProps) {
  return (
    <div className="rounded-3xl bg-surface border border-border shadow-card p-6 sm:p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-card">
        <Trophy className="w-10 h-10 transition-transform hover:scale-105 duration-300" />
      </div>

      <div className="space-y-1">
        <span className={cn("inline-block px-4 py-1.5 rounded-full text-xs font-extrabold border uppercase tracking-wider mb-2", rankInfo.color)}>
          {rankInfo.title}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display tracking-tight">
          {t("quiz_result_title")}
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          {t("quiz_result_desc", { count: totalQuestions })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto pt-2">
        <div className="bg-teal-50 border border-teal-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-teal-800 text-xs font-bold uppercase mb-1">
            <Zap className="w-3.5 h-3.5 text-teal-600" /> {t("total_score")}
          </div>
          <div className="text-2xl font-extrabold text-teal-950">
            {earnedPoints} <span className="text-xs text-muted font-normal">/ {maxPossiblePoints}</span>
          </div>
          <div className="text-[11px] text-teal-700 mt-1 font-medium">{t("score_sub")}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-emerald-800 text-xs font-bold uppercase mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t("correct_answers")}
          </div>
          <div className="text-2xl font-extrabold text-emerald-950">
            {score} <span className="text-xs text-muted font-normal">/ {totalQuestions}</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            {t("correct_sub")}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-amber-800 text-xs font-bold uppercase mb-1">
            <Award className="w-3.5 h-3.5 text-amber-600" /> {t("accuracy_rate")}
          </div>
          <div className="text-2xl font-extrabold text-amber-950">
            {accuracyPercent}%
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            {t("accuracy")}
          </div>
        </div>
      </div>

      {/* Missed Words Review Section */}
      {incorrectWords.length > 0 ? (
        <div className="max-w-2xl mx-auto text-left bg-surface-2/60 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{t("incorrect_words_title", { count: incorrectWords.length })}</span>
            </div>
            {handleRetryMissed && (
              <Button
                size="sm"
                onClick={handleRetryMissed}
                className="h-8 text-xs font-bold px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
              >
                <RotateCw className="w-3 h-3 mr-1.5" />
                {t("btn_review_missed", { count: incorrectWords.length })}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {incorrectWords.map((item) => {
              const def = getDefinitionForTargetLang ? getDefinitionForTargetLang(item) : item.word.definition;
              return (
                <div
                  key={item.id}
                  className="bg-surface rounded-xl p-3 border border-border/70 flex items-start justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{item.word.term}</span>
                      {item.word.phonetic && (
                        <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          {item.word.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted font-medium line-clamp-2">{def}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakWord(item.word.term, item.word.language?.code || "en")}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
                    title={t("btn_audio_tooltip")}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 shadow-2xs">
          <span>🎉</span>
          <span>{t("perfect_score_message")}</span>
        </div>
      )}

      {/* Bottom CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button
          onClick={handleRestartQuiz}
          className="rounded-full h-12 px-7 font-bold shadow-card sd-btn-gradient text-white cursor-pointer"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          <span>{t("btn_new_quiz")}</span>
        </Button>
        <Button
          onClick={() => setActiveTab("notebook")}
          variant="outline"
          className="rounded-full h-12 px-7 font-bold border-border bg-white hover:bg-surface-2 shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          <span>{t("btn_view_notebook")}</span>
        </Button>
      </div>
    </div>
  );
}
