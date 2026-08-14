"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { HelpCircle, Volume2, Check, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageDisplayName, speakWord } from "@/hooks/useVocabulary";
import { SavedWord } from "@/components/features/WordSaveModal";

interface QuizQuestionViewProps {
  t: any;
  deck: SavedWord[];
  activeQuizWord: SavedWord;
  currentIndex: number;
  score: number;
  streak: number;
  getDefinitionForTargetLang: (word: SavedWord) => string;
  quizOptions: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  handleSelectOption: (option: string) => void;
  handleNextQuestion: () => void;
}

export function QuizQuestionView({
  t,
  deck,
  activeQuizWord,
  currentIndex,
  score,
  streak,
  getDefinitionForTargetLang,
  quizOptions,
  selectedOption,
  isAnswered,
  handleSelectOption,
  handleNextQuestion,
}: QuizQuestionViewProps) {
  return (
    <div className="rounded-3xl bg-surface border-2 border-border shadow-lg p-6 md:p-8 space-y-6 relative overflow-hidden">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-muted flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-primary" /> {t("question_progress", { current: currentIndex + 1, total: deck.length })}
          </span>

          <div className="flex items-center gap-3">
            <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-full text-xs">
              ⚡ {t("points", { points: score * 10 })}
            </span>

            {streak > 1 && (
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold animate-pulse">
                🔥 {t("streak", { streak })}
              </span>
            )}

            <span
              className={cn(
                "font-bold px-3 py-1 rounded-full text-[11px]",
                activeQuizWord.status === "mastered"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
              )}
            >
              {activeQuizWord.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}
            </span>
          </div>
        </div>

        <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{
              width: `${((currentIndex + 1) / deck.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="text-center py-5 bg-muted/5 rounded-2xl border border-border/60 p-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">
          {getLanguageDisplayName(activeQuizWord)}
        </div>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            {activeQuizWord.word.term}
          </h2>
          <button
            type="button"
            onClick={() =>
              speakWord(
                activeQuizWord.word.term,
                activeQuizWord.word.language?.code || "en",
              )
            }
            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95"
            title={t("btn_audio_tooltip")}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {activeQuizWord.word.phonetic && (
          <p className="text-sm font-semibold text-rose-500">
            {activeQuizWord.word.phonetic}
          </p>
        )}

        <p className="text-xs text-muted font-medium pt-1">
          {t("select_correct_def_prompt")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {quizOptions.map((opt, idx) => {
          const correctDef = getDefinitionForTargetLang(activeQuizWord);
          const isThisCorrect =
            opt.trim().toLowerCase() === correctDef.trim().toLowerCase();
          const isThisSelected = selectedOption === opt;

          let optionStyle =
            "border-border bg-surface hover:border-primary/50 hover:bg-muted/10 text-foreground";
          let optionIcon = null;

          if (isAnswered) {
            if (isThisSelected && isThisCorrect) {
              optionStyle =
                "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold";
              optionIcon = <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
            } else if (isThisSelected && !isThisCorrect) {
              optionStyle =
                "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30 font-bold";
              optionIcon = <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
            } else if (!isThisSelected && isThisCorrect) {
              optionStyle =
                "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
              optionIcon = <Check className="w-5 h-5 text-emerald-500 shrink-0" />;
            } else {
              optionStyle = "border-border/40 bg-surface/50 text-muted opacity-50";
            }
          }

          const labels = ["A", "B", "C", "D"];

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => void handleSelectOption(opt)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 text-left text-sm transition-all duration-200 flex items-center justify-between gap-3 group active:scale-[0.99]",
                optionStyle,
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-muted/20 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  {labels[idx]}
                </span>
                <span className="font-medium leading-snug">{opt}</span>
              </div>
              {optionIcon}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="pt-2 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            onClick={handleNextQuestion}
            className="rounded-2xl h-12 px-6 font-bold shadow-md bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-95"
          >
            {currentIndex + 1 < deck.length ? t("btn_next_question") : t("btn_view_score")}{" "}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
