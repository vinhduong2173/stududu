"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { HelpCircle, Volume2, Check, X, ChevronRight, Flame } from "lucide-react";
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
  streak,
  getDefinitionForTargetLang,
  quizOptions,
  selectedOption,
  isAnswered,
  handleSelectOption,
  handleNextQuestion,
}: QuizQuestionViewProps) {
  const correctDef = getDefinitionForTargetLang(activeQuizWord);
  const labels = ["A", "B", "C", "D"];

  return (
    <div className="rounded-3xl bg-surface border border-border shadow-card p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Progress and Streaks */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-muted flex items-center gap-1.5 font-semibold">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>{t("question_progress", { current: currentIndex + 1, total: deck.length })}</span>
          </span>

          <div className="flex items-center gap-2.5">
            {streak > 1 && (
              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-extrabold animate-pulse shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>{t("streak", { streak })}</span>
              </span>
            )}

            <span
              className={cn(
                "font-extrabold px-3 py-1 rounded-full text-xs border shadow-2xs",
                activeQuizWord.status === "mastered"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                  : "bg-amber-50 text-amber-800 border-amber-200/80",
              )}
            >
              {activeQuizWord.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Word Question Prompt Card */}
      <div className="text-center py-6 bg-surface-2/60 rounded-2xl border border-border/70 p-4 space-y-2 shadow-2xs">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
          {getLanguageDisplayName(activeQuizWord)}
        </div>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display tracking-tight">
            {activeQuizWord.word.term}
          </h2>
          <button
            type="button"
            onClick={() => speakWord(activeQuizWord.word.term, activeQuizWord.word.language?.code || "en")}
            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95 cursor-pointer"
            title={t("btn_audio_tooltip")}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {activeQuizWord.word.phonetic && (
          <p className="text-xs font-bold text-rose-600 font-mono">
            /{activeQuizWord.word.phonetic}/
          </p>
        )}

        <p className="text-xs text-muted font-medium pt-1">
          {t("select_correct_def_prompt")}
        </p>
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-3">
        {quizOptions.map((opt, idx) => {
          const isThisCorrect = opt.trim().toLowerCase() === correctDef.trim().toLowerCase();
          const isThisSelected = selectedOption === opt;

          let optionStyle = "border-border bg-surface hover:border-primary/50 hover:bg-surface-2/60 text-foreground cursor-pointer";
          let optionIcon = null;

          if (isAnswered) {
            if (isThisSelected && isThisCorrect) {
              optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30 font-bold";
              optionIcon = <Check className="w-5 h-5 text-emerald-600 shrink-0" />;
            } else if (isThisSelected && !isThisCorrect) {
              optionStyle = "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30 font-bold";
              optionIcon = <X className="w-5 h-5 text-rose-600 shrink-0" />;
            } else if (!isThisSelected && isThisCorrect) {
              optionStyle = "border-emerald-500/60 bg-emerald-50/60 text-emerald-800 font-semibold";
              optionIcon = <Check className="w-5 h-5 text-emerald-500 shrink-0" />;
            } else {
              optionStyle = "border-border/40 bg-surface/50 text-muted opacity-50 cursor-default";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => void handleSelectOption(opt)}
              className={cn(
                "w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-150 flex items-center justify-between gap-3 group active:scale-[0.99] shadow-2xs",
                optionStyle,
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-surface-2 border border-border flex items-center justify-center font-extrabold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  {labels[idx]}
                </span>
                <span className="font-semibold leading-snug">{opt}</span>
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
            className="rounded-full h-12 px-7 font-bold shadow-card sd-btn-gradient text-white cursor-pointer group gap-1.5"
          >
            <span>{currentIndex + 1 < deck.length ? t("btn_next_question") : t("btn_view_score")}</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
