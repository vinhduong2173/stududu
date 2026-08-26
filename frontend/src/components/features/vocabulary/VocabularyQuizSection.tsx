"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { RotateCw, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewMode } from "@/hooks/useVocabulary";
import { SavedWord } from "@/components/features/WordSaveModal";
import { QuizCompletedView } from "./QuizCompletedView";
import { QuizQuestionView } from "./QuizQuestionView";

interface VocabularyQuizSectionProps {
  t: any;
  reviewMode: ReviewMode;
  handleModeChange: (mode: ReviewMode) => void;
  learningCount: number;
  totalCount: number;
  loading: boolean;
  quizCompleted: boolean;
  rankInfo: { title: string; color: string };
  totalQuestions: number;
  earnedPoints: number;
  maxPossiblePoints: number;
  score: number;
  accuracyPercent: number;
  handleRestartQuiz: () => void;
  setActiveTab: (tab: "quiz" | "notebook") => void;
  deck: SavedWord[];
  activeQuizWord: SavedWord | null;
  currentIndex: number;
  streak: number;
  getDefinitionForTargetLang: (word: SavedWord) => string;
  quizOptions: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  handleSelectOption: (option: string) => void;
  handleNextQuestion: () => void;
  incorrectWords?: SavedWord[];
  handleRetryMissed?: () => void;
}

export function VocabularyQuizSection({
  t,
  reviewMode,
  handleModeChange,
  learningCount,
  totalCount,
  loading,
  quizCompleted,
  rankInfo,
  totalQuestions,
  earnedPoints,
  maxPossiblePoints,
  score,
  accuracyPercent,
  handleRestartQuiz,
  setActiveTab,
  deck,
  activeQuizWord,
  currentIndex,
  streak,
  getDefinitionForTargetLang,
  quizOptions,
  selectedOption,
  isAnswered,
  handleSelectOption,
  handleNextQuestion,
  incorrectWords,
  handleRetryMissed,
}: VocabularyQuizSectionProps) {
  return (
    <div className="space-y-4">
      {/* Review Mode Switcher */}
      <div className="flex items-center justify-between bg-surface p-1.5 rounded-full border border-border shadow-card max-w-md mx-auto">
        <button
          type="button"
          onClick={() => handleModeChange("learning_only")}
          className={cn(
            "flex-1 py-2 px-3 rounded-full text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
            reviewMode === "learning_only"
              ? "bg-slate-900 text-white shadow-card"
              : "text-muted hover:text-foreground hover:bg-surface-2",
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>{t("btn_review_learning", { count: learningCount })}</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("all")}
          className={cn(
            "flex-1 py-2 px-3 rounded-full text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
            reviewMode === "all"
              ? "bg-slate-900 text-white shadow-card"
              : "text-muted hover:text-foreground hover:bg-surface-2",
          )}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{t("btn_review_all", { count: totalCount })}</span>
        </button>
      </div>

      {loading ? (
        <div className="h-96 rounded-3xl bg-surface border border-border shadow-card animate-pulse flex items-center justify-center text-muted text-sm font-semibold">
          {t("quiz_loading")}
        </div>
      ) : quizCompleted ? (
        <QuizCompletedView
          t={t}
          rankInfo={rankInfo}
          totalQuestions={totalQuestions}
          earnedPoints={earnedPoints}
          maxPossiblePoints={maxPossiblePoints}
          score={score}
          accuracyPercent={accuracyPercent}
          handleRestartQuiz={handleRestartQuiz}
          setActiveTab={setActiveTab}
          incorrectWords={incorrectWords}
          handleRetryMissed={handleRetryMissed}
          getDefinitionForTargetLang={getDefinitionForTargetLang}
        />
      ) : deck.length > 0 && activeQuizWord ? (
        <QuizQuestionView
          t={t}
          deck={deck}
          activeQuizWord={activeQuizWord}
          currentIndex={currentIndex}
          score={score}
          streak={streak}
          getDefinitionForTargetLang={getDefinitionForTargetLang}
          quizOptions={quizOptions}
          selectedOption={selectedOption}
          isAnswered={isAnswered}
          handleSelectOption={handleSelectOption}
          handleNextQuestion={handleNextQuestion}
        />
      ) : (
        /* Empty Deck State */
        <div className="min-h-[320px] rounded-3xl bg-surface border border-border shadow-card p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs mb-2">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground font-display">
            {reviewMode === "learning_only" ? t("empty_learning_title") : t("empty_notebook_title")}
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-sm leading-relaxed">
            {reviewMode === "learning_only" ? t("empty_learning_desc") : t("empty_notebook_desc")}
          </p>
          {reviewMode === "learning_only" && (
            <Button
              onClick={() => handleModeChange("all")}
              variant="outline"
              className="rounded-full h-11 px-6 font-bold border-border bg-white hover:bg-surface-2 cursor-pointer mt-2"
            >
              {t("btn_review_all_full", { count: totalCount })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
