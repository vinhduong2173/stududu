"use client";

import * as React from "react";
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  X,
  Award,
  Timer,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  AttemptResult,
  AttemptStart,
  displayIndexOfCorrect,
  formatDuration,
} from "@/lib/questionSets";

export type KahootQuizEngineProps = {
  attempt: AttemptStart;
  onComplete: (answers: Record<number, number>, score?: number) => Promise<AttemptResult | void>;
  submitting: boolean;
  result: AttemptResult | null;
};

// Kahoot/Quizizz style 4 vibrant color themes with shape symbols
const ANSWER_THEMES = [
  {
    bg: "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-rose-500/25",
    activeBg: "bg-rose-600 ring-4 ring-rose-300 text-white",
    correctBg: "bg-emerald-600 text-white ring-4 ring-emerald-300",
    wrongBg: "bg-rose-700 text-rose-100 opacity-60",
    symbol: "▲",
    label: "A",
    colorName: "Đỏ",
  },
  {
    bg: "bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sky-500/25",
    activeBg: "bg-sky-600 ring-4 ring-sky-300 text-white",
    correctBg: "bg-emerald-600 text-white ring-4 ring-emerald-300",
    wrongBg: "bg-sky-700 text-sky-100 opacity-60",
    symbol: "◆",
    label: "B",
    colorName: "Xanh Dương",
  },
  {
    bg: "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/25",
    activeBg: "bg-amber-600 ring-4 ring-amber-300 text-white",
    correctBg: "bg-emerald-600 text-white ring-4 ring-emerald-300",
    wrongBg: "bg-amber-700 text-amber-100 opacity-60",
    symbol: "●",
    label: "C",
    colorName: "Vàng",
  },
  {
    bg: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25",
    activeBg: "bg-emerald-600 ring-4 ring-emerald-300 text-white",
    correctBg: "bg-emerald-600 text-white ring-4 ring-emerald-300",
    wrongBg: "bg-emerald-700 text-emerald-100 opacity-60",
    symbol: "■",
    label: "D",
    colorName: "Xanh Lá",
  },
];

export function KahootQuizEngine({
  attempt,
  onComplete,
  submitting,
  result,
}: KahootQuizEngineProps) {
  const t = useTranslations("quiz");
  const timePerQuestionSec = attempt.set.timePerQuestionSec || 15;
  const questions = attempt.questions;

  // Game Stage States
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = React.useState(timePerQuestionSec);
  const [isLocked, setIsLocked] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [maxStreak, setMaxStreak] = React.useState(0);
  const [feedback, setFeedback] = React.useState<{
    type: "correct" | "wrong" | "timeout";
    pointsAdded?: number;
  } | null>(null);

  const currentQ = questions[currentIndex];

  // Timer Effect
  React.useEffect(() => {
    if (result || isLocked) return;

    setTimeLeft(timePerQuestionSec);
    setFeedback(null);

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
  }, [currentIndex, isLocked, result, timePerQuestionSec]);

  // Handle Timeout for current question
  const handleTimeOut = () => {
    if (isLocked) return;
    setIsLocked(true);
    setStreak(0);
    setFeedback({ type: "timeout" });
  };

  // Handle User Pick Answer
  const handleSelectOption = (optionIndex: number) => {
    if (isLocked || !currentQ) return;
    setIsLocked(true);

    const updatedAnswers = { ...userAnswers, [currentQ.id]: optionIndex };
    setUserAnswers(updatedAnswers);

    // Calculate score bonus based on speed
    const speedBonus = Math.round((timeLeft / timePerQuestionSec) * 500);
    const addedPoints = 1000 + speedBonus;

    // We consider optionIndex 0 as default correct preview if unknown until server submit
    setScore((prev) => prev + addedPoints);
    setStreak((prev) => {
      const nextStreak = prev + 1;
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);
      return nextStreak;
    });

    setFeedback({
      type: "correct",
      pointsAdded: addedPoints,
    });
  };

  // Move to Next Question or Submit Game
  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLocked(false);
      setFeedback(null);
    } else {
      // Submit entire attempt to backend
      await onComplete(userAnswers, score);
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

  // GAMIFIED RESULT SCREEN AFTER SUBMIT
  if (result) {
    const accuracy =
      result.totalCount > 0
        ? Math.round((result.correctCount / result.totalCount) * 100)
        : 0;

    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 animate-in fade-in zoom-in duration-300">
        {/* Back Link */}
        <div className="flex justify-between items-center">
          <Link
            href="/community?tab=events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài test
          </Link>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {attempt.set.framework} {attempt.set.level} • {attempt.set.topic.name}
          </span>
        </div>

        {/* Gamified Podium Result Card */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-surface via-surface to-primary/5 p-6 md:p-8 text-center shadow-xl">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-500/5 shadow-inner">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground font-display">
            Hoàn Thành Bài Test! 🎉
          </h2>
          <p className="text-sm text-muted mt-1">{attempt.set.title}</p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 my-6">
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-4 text-center shadow-xs">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                Điểm Số Gamified
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-primary font-display">
                {score.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">PTS</span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface/80 p-4 text-center shadow-xs">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                Độ Chính Xác
              </span>
              <span
                className={cn(
                  "text-2xl md:text-3xl font-extrabold font-display",
                  accuracy >= 80
                    ? "text-emerald-600"
                    : accuracy >= 50
                    ? "text-sky-600"
                    : "text-amber-600"
                )}
              >
                {result.correctCount}/{result.totalCount}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">({accuracy}%)</span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface/80 p-4 text-center shadow-xs">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                Chuỗi Đúng Dài Nhất
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-rose-500 font-display flex items-center justify-center gap-1">
                <Flame className="w-6 h-6 fill-rose-500" />
                {maxStreak || (result.correctCount > 1 ? result.correctCount : 1)}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">STREAK MAX</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/community?tab=events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground text-sm shadow-md hover:opacity-90 transition-all"
            >
              Quay lại danh sách bài test
            </Link>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Chi tiết kết quả các câu hỏi
          </h3>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const review = result.review.find((r) => r.questionId === q.id);
              const isCorrect = review ? review.isCorrect : false;
              const chosenIdx = userAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-2xl border p-4 transition-all bg-surface",
                    isCorrect
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-rose-500/30 bg-rose-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          isCorrect ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      >
                        {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-xs font-bold text-muted">Câu {idx + 1}</span>
                    </div>

                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-0.5 rounded-full border",
                        isCorrect
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      )}
                    >
                      {isCorrect ? "Đúng" : "Chưa đúng"}
                    </span>
                  </div>

                  <p className="font-bold text-sm text-foreground mb-3">{q.prompt}</p>

                  {/* Options Mini Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isOptionChosen = chosenIdx === optIdx;
                      const isOptionCorrect = displayIndexOfCorrect(q.options, review) === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2",
                            isOptionCorrect
                              ? "bg-emerald-500 text-white border-emerald-600"
                              : isOptionChosen
                              ? "bg-rose-500 text-white border-rose-600"
                              : "bg-background text-muted border-border/60"
                          )}
                        >
                          <span>{opt}</span>
                          {isOptionCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {review?.explanation && (
                    <div className="mt-3 text-xs text-muted bg-surface/80 p-2.5 rounded-xl border border-border/50">
                      💡 <strong>Giải thích:</strong> {review.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE KAHOOT / QUIZZIZ GAME STAGE
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 select-none">
      {/* GAMIFIED STAGE HEADER */}
      <div className="bg-surface rounded-3xl border border-border shadow-md p-5 md:p-6 space-y-4">
        {/* Top bar: Question Progress & Timer & Streak */}
        <div className="flex items-center justify-between gap-2 text-xs md:text-sm font-bold">
          <div className="flex items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs md:text-sm font-extrabold">
              {t("question_num", { n: `${currentIndex + 1}/${questions.length}` })}
            </span>
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-surface border border-border text-muted font-medium text-xs md:text-sm">
              {attempt.set.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs md:text-sm font-extrabold animate-pulse">
              <Flame className="w-4 h-4 md:w-5 md:h-5 fill-rose-500" />
              <span>{t("streak_multiplier", { count: streak })}</span>
            </div>

            {/* Live Score */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs md:text-sm font-extrabold font-display">
              <Zap className="w-4 h-4 md:w-5 md:h-5 fill-amber-500" />
              <span>{score} PTS</span>
            </div>
          </div>
        </div>

        {/* PER-QUESTION COUNTDOWN TIMER BAR */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs md:text-sm font-bold text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />{t("remaining_time")}
            </span>
            <span
              className={cn(
                "px-3 py-0.5 rounded-full text-xs md:text-sm font-extrabold font-mono transition-colors",
                timeLeft <= 5 ? "bg-rose-500 text-white animate-ping" : "bg-primary/10 text-primary"
              )}
            >
              ⏱️ {timeLeft}s
            </span>
          </div>

          {/* Animated Countdown Progress Bar */}
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

      {/* KAHOOT QUESTION STAGE CARD */}
      <div className="relative bg-surface rounded-3xl border border-border shadow-2xl p-6 md:p-10 space-y-8 overflow-hidden">
        {/* Type Badge & Term */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-extrabold uppercase tracking-wider">
            {currentQ?.type === "vocabulary"
              ? t("type_vocabulary")
              : currentQ?.type === "grammar"
              ? t("type_grammar")
              : currentQ?.type === "cloze"
              ? t("type_cloze")
              : currentQ?.type === "reading"
              ? t("type_reading")
              : currentQ?.type}
          </span>
          {currentQ?.term && (
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs md:text-sm font-bold">
              {t("term_label", { term: currentQ.term })}
            </span>
          )}
        </div>

        {/* Passage (if any) */}
        {currentQ?.passage && (
          <div className="p-5 rounded-2xl bg-muted/10 border border-border/60 text-base md:text-lg leading-relaxed text-foreground/90 font-medium">
            {currentQ.passage}
          </div>
        )}

        {/* Main Question Prompt */}
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground leading-snug font-display">
          {currentQ?.prompt}
        </h2>

        {/* KAHOOT/QUIZZIZ 4 COLOR-CODED ANSWER OPTIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 pt-2">
          {currentQ?.options.map((optText, optIdx) => {
            const theme = ANSWER_THEMES[optIdx % ANSWER_THEMES.length];
            const isPicked = userAnswers[currentQ.id] === optIdx;

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelectOption(optIdx)}
                className={cn(
                  "relative group min-h-[90px] md:min-h-[110px] p-5 md:p-6 rounded-2xl font-bold text-left transition-all transform active:scale-95 flex items-center justify-between gap-4 shadow-lg border-2",
                  theme.bg,
                  isPicked && theme.activeBg,
                  isLocked && !isPicked && "opacity-50 grayscale-20 scale-98 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Symbol Badge */}
                  <span className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl md:text-2xl font-black shrink-0 text-white shadow-inner">
                    {theme.symbol}
                  </span>
                  <span className="text-base md:text-xl leading-snug font-display font-bold">
                    {optText}
                  </span>
                </div>

                {isPicked && (
                  <span className="w-7 h-7 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-lg animate-in zoom-in duration-200">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* INSTANT FEEDBACK OVERLAY / ACTION BAR */}
        {isLocked && (
          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {feedback?.type === "correct" ? (
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{t("excellent_added", { pts: feedback.pointsAdded ?? 0 })}</span>
              </div>
            ) : feedback?.type === "timeout" ? (
              <div className="flex items-center gap-2 text-rose-500 font-extrabold text-sm">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>{t("timeout_added")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <span>{t("wrong_added")}</span>
              </div>
            )}

            <Button
              disabled={submitting}
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center justify-center gap-2 text-sm"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  <span>{t("next_question")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
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
