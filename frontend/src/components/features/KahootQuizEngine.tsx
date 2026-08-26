"use client";

import * as React from "react";
import {
  Check,
  X,
  Clock,
  ChevronRight,
  Sparkles,
  Trophy,
  Flame,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  AttemptResult,
  AttemptStart,
  formatDuration,
} from "@/lib/questionSets";

export type KahootQuizEngineProps = {
  attempt: AttemptStart;
  onComplete: (answers: Record<number, number>, score?: number) => Promise<AttemptResult | void>;
  submitting: boolean;
  result: AttemptResult | null;
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function KahootQuizEngine({
  attempt,
  onComplete,
  submitting,
  result,
}: KahootQuizEngineProps) {
  const t = useTranslations("quiz");
  const timePerQuestionSec = attempt.set.timePerQuestionSec || 60;
  const questions = attempt.questions;

  // Game Stage States
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = React.useState(timePerQuestionSec);
  const [isLocked, setIsLocked] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [maxStreak, setMaxStreak] = React.useState(0);

  const currentQ = questions[currentIndex];

  // Handle Timeout for current question
  const handleTimeOut = React.useCallback(() => {
    setIsLocked(true);
    setStreak(0);
  }, []);

  // Timer Effect
  React.useEffect(() => {
    if (result || isLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isLocked, result, handleTimeOut]);

  // Handle User Pick Answer
  const handleSelectOption = (optionIndex: number) => {
    if (isLocked || !currentQ) return;
    setIsLocked(true);

    const updatedAnswers = { ...userAnswers, [currentQ.id]: optionIndex };
    setUserAnswers(updatedAnswers);

    const isCorrect =
      currentQ.answerIndex !== undefined && optionIndex === currentQ.answerIndex;

    if (isCorrect) {
      setStreak((prev) => {
        const nextStreak = prev + 1;
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);
        return nextStreak;
      });
    } else {
      setStreak(0);
    }
  };

  // Move to Next Question or Submit Game
  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timePerQuestionSec);
      setIsLocked(false);
    } else {
      await onComplete(userAnswers);
    }
  };

  // Calculate timer percent & color
  const timerPercent = (timeLeft / timePerQuestionSec) * 100;
  const timerColorClass =
    timerPercent > 50
      ? "bg-emerald-500 text-emerald-700"
      : timerPercent > 25
      ? "bg-amber-500 text-amber-700"
      : "bg-rose-500 text-rose-700 animate-pulse";

  // Clean prompt string from legacy prefix/suffix
  const rawPrompt = currentQ?.prompt || currentQ?.term || "";
  const displayPrompt =
    rawPrompt
      .replace(/^Từ\s*['"“‘](.+?)['"”’]\s*có\s+nghĩa\s+là\s+gì\??$/i, "$1")
      .trim() || rawPrompt;

  // RESULT SCREEN AFTER SUBMIT
  if (result) {
    const accuracy =
      result.totalCount > 0
        ? Math.round((result.correctCount / result.totalCount) * 100)
        : 0;

    return (
      <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8 md:p-10 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center">
          <Link
            href="/community?tab=events"
            className="inline-flex items-center gap-2 text-base font-bold text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> Quay lại danh sách bài test
          </Link>
          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-extrabold">
            {attempt.set.framework} {attempt.set.level} • {attempt.set.topic.name}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-surface p-8 sm:p-12 text-center shadow-card">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mb-6 shadow-sm">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-foreground font-display">
            Hoàn Thành Bài Test!
          </h2>
          <p className="text-base text-muted mt-2">{attempt.set.title}</p>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 my-8">
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 text-center shadow-xs">
              <span className="text-xs sm:text-sm font-bold text-muted uppercase tracking-wider block mb-1">
                Số Câu Đúng
              </span>
              <span className="text-3xl sm:text-4xl font-black text-primary font-display">
                {result.correctCount}/{result.totalCount}
              </span>
              <span className="text-xs text-muted block mt-1">câu trả lời đúng</span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 text-center shadow-xs">
              <span className="text-xs sm:text-sm font-bold text-muted uppercase tracking-wider block mb-1">
                Độ Chính Xác
              </span>
              <span
                className={cn(
                  "text-3xl sm:text-4xl font-black font-display",
                  accuracy >= 80
                    ? "text-emerald-600"
                    : accuracy >= 50
                    ? "text-sky-600"
                    : "text-amber-600"
                )}
              >
                {accuracy}%
              </span>
              <span className="text-xs text-muted block mt-1">
                {accuracy >= 80 ? "Xuất sắc" : accuracy >= 50 ? "Khá tốt" : "Cần cố gắng"}
              </span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 text-center shadow-xs">
              <span className="text-xs sm:text-sm font-bold text-muted uppercase tracking-wider block mb-1">
                Thời Gian
              </span>
              <span className="text-3xl sm:text-4xl font-black text-foreground font-display">
                {formatDuration(result.durationSec)}
              </span>
              <span className="text-xs text-muted block mt-1">
                Chuỗi đúng: {maxStreak} câu
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2 font-bold px-8 py-3.5 rounded-2xl text-sm"
            >
              <RotateCcw className="h-5 w-5" /> Làm lại bài test
            </Button>
            <Link href="/community?tab=events">
              <Button className="gap-2 font-bold px-8 py-3.5 rounded-2xl text-sm bg-primary text-primary-foreground shadow-md">
                Khám phá bài test khác <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-extrabold text-foreground font-display">
            Xem lại chi tiết ({result.review.length} câu)
          </h3>

          <div className="space-y-3.5">
            {result.review.map((item, idx) => {
              const isCorrect = item.isCorrect;
              return (
                <div
                  key={item.questionId}
                  className={cn(
                    "p-6 rounded-2xl border transition-all text-sm space-y-3.5 shadow-xs",
                    isCorrect
                      ? "bg-emerald-50/30 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-rose-50/30 border-rose-200 dark:border-rose-900/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0",
                          isCorrect ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-base text-foreground">
                        {isCorrect ? "Chính xác" : "Chưa chính xác"}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-extrabold uppercase",
                        isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {isCorrect ? "Đúng" : "Sai"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-surface border border-border/60">
                      <span className="text-muted block font-semibold text-xs mb-1">Đáp án bạn chọn:</span>
                      <p
                        className={cn(
                          "font-bold text-sm",
                          isCorrect ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {item.chosenIndex !== null
                          ? `${OPTION_LETTERS[item.chosenIndex]}. ${item.options[item.chosenIndex]}`
                          : "Không chọn"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface border border-border/60">
                      <span className="text-muted block font-semibold text-xs mb-1">Đáp án đúng:</span>
                      <p className="font-bold text-sm text-emerald-600">
                        {OPTION_LETTERS[item.answerIndex]}. {item.options[item.answerIndex]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION VIEW - LARGE, IMMERSIVE, FULL PRESENCE
  return (
    <div className="mx-auto w-full max-w-5xl xl:max-w-6xl space-y-6 p-4 sm:p-8 md:p-10 select-none">
      {/* TOP HEADER BAR */}
      <div className="bg-surface rounded-3xl border-2 border-border shadow-md p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-sm sm:text-base font-black tracking-tight">
              {t("question_num", { n: `${currentIndex + 1}/${questions.length}` })}
            </span>
            <span className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-surface-2 border border-border text-foreground font-bold text-sm sm:text-base">
              {attempt.set.title}
            </span>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-sm sm:text-base font-black animate-pulse">
              <Flame className="w-5 h-5 fill-rose-500" />
              <span>{t("streak_multiplier", { count: streak })}</span>
            </div>
          )}
        </div>

        {/* PER-QUESTION COUNTDOWN TIMER BAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-muted">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("remaining_time")}
            </span>
            <span
              className={cn(
                "px-3.5 py-1 rounded-xl text-sm sm:text-base font-mono font-black transition-colors shadow-2xs",
                timeLeft <= 5 ? "bg-rose-500 text-white animate-ping" : "bg-primary/10 text-primary"
              )}
            >
              {timeLeft}s
            </span>
          </div>

          <div className="h-3.5 w-full bg-muted/20 rounded-full overflow-hidden p-0.5 border border-border/50">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear shadow-xs",
                timerColorClass
              )}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="relative bg-surface rounded-3xl border-2 border-border shadow-xl p-8 sm:p-12 md:p-14 space-y-8 overflow-hidden">
        {currentQ?.passage && (
          <div className="p-6 rounded-2xl bg-muted/10 border border-border/60 text-base md:text-lg leading-relaxed text-foreground/90 font-medium">
            {currentQ.passage}
          </div>
        )}

        {/* Big, legible Question Prompt */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground leading-tight font-display tracking-tight">
          {displayPrompt}
        </h2>

        {/* 4 ANSWER OPTIONS GRID - LARGE & SPACIOUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {currentQ?.options.map((optText, optIdx) => {
            const isPicked = userAnswers[currentQ.id] === optIdx;
            const isCorrectOption =
              currentQ.answerIndex !== undefined && optIdx === currentQ.answerIndex;

            let cardStyle =
              "bg-surface hover:bg-muted/15 border-2 border-border text-foreground hover:border-primary/50 shadow-sm hover:shadow-md hover:scale-[1.01]";
            let iconNode = null;

            if (isLocked) {
              if (isPicked && isCorrectOption) {
                cardStyle =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-4 ring-emerald-300/60 scale-[1.02] shadow-md";
                iconNode = (
                  <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </span>
                );
              } else if (isPicked && !isCorrectOption) {
                cardStyle =
                  "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-950 dark:text-rose-100 ring-4 ring-rose-300/60 scale-[1.02] shadow-md";
                iconNode = (
                  <span className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <X className="w-5 h-5 stroke-[3]" />
                  </span>
                );
              } else if (!isPicked && isCorrectOption) {
                cardStyle =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-4 ring-emerald-300/40 shadow-sm";
                iconNode = (
                  <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </span>
                );
              } else {
                cardStyle =
                  "bg-muted/10 text-muted/50 border border-border/40 opacity-40 grayscale cursor-not-allowed";
              }
            } else if (isPicked) {
              cardStyle = "bg-primary/10 border-2 border-primary text-foreground ring-4 ring-primary/30";
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelectOption(optIdx)}
                className={cn(
                  "relative min-h-[90px] sm:min-h-[110px] md:min-h-[125px] p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl font-bold text-left transition-all transform active:scale-98 flex items-center justify-between gap-4 cursor-pointer",
                  cardStyle
                )}
              >
                <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                  <span
                    className={cn(
                      "w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-base sm:text-lg md:text-xl font-black shrink-0 border-2 shadow-xs transition-colors",
                      isLocked && isCorrectOption
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : isLocked && isPicked && !isCorrectOption
                        ? "bg-rose-500 text-white border-rose-600"
                        : "bg-muted/20 text-foreground border-border/70"
                    )}
                  >
                    {OPTION_LETTERS[optIdx % 4]}
                  </span>
                  <span className="text-base sm:text-lg md:text-xl leading-snug font-bold">
                    {optText}
                  </span>
                </div>

                {iconNode}
              </button>
            );
          })}
        </div>

        {/* BOTTOM ACTION BUTTON */}
        {isLocked && (
          <div className="pt-6 border-t border-border/60 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              disabled={submitting}
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base md:text-lg cursor-pointer transition-all"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  <span>{t("next_question")}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{submitting ? t("submitting") : t("submit_attempt")}</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
