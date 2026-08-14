"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { RotateCw, Sparkles } from "lucide-react";
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
}: VocabularyQuizSectionProps) {
  return (
    <div className="space-y-4">
      {/* REVIEW MODE TOGGLE TABS */}
      <div className="flex items-center justify-between bg-surface p-1.5 rounded-2xl border border-border shadow-sm">
        <div className="flex gap-1 w-full">
          <button
            onClick={() => handleModeChange("learning_only")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5",
              reviewMode === "learning_only"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-muted/10",
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("btn_review_learning", { count: learningCount })}
          </button>
          <button
            onClick={() => handleModeChange("all")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5",
              reviewMode === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-muted/10",
            )}
          >
            <RotateCw className="w-3.5 h-3.5" />
            {t("btn_review_all", { count: totalCount })}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-3xl bg-muted/10 animate-pulse flex items-center justify-center text-muted text-sm">
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
        /* EMPTY DECK STATE */
        <div className="min-h-[320px] rounded-3xl bg-surface border border-border shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h3 className="text-xl font-extrabold text-foreground">
            {reviewMode === "learning_only"
              ? t("empty_learning_title")
              : t("empty_notebook_title")}
          </h3>
          <p className="text-sm text-muted max-w-xs">
            {reviewMode === "learning_only"
              ? t("empty_learning_desc")
              : t("empty_notebook_desc")}
          </p>
          {reviewMode === "learning_only" && (
            <Button onClick={() => handleModeChange("all")} variant="ghost">
              {t("btn_review_all_full", { count: totalCount })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
