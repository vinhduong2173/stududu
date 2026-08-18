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
  CheckCircle2,
  XCircle,
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
  const timePerQuestionSec = attempt.set.timePerQuestionSec || 15;
  const questions = attempt.questions;

  // Game Stage States
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = React.useState(timePerQuestionSec);
  const [isLocked, setIsLocked] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [maxStreak, setMaxStreak] = React.useState(0);
  const [feedback, setFeedback] = React.useState<{
    type: "correct" | "wrong" | "timeout";
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

    const isCorrect =
      currentQ.answerIndex !== undefined && optionIndex === currentQ.answerIndex;

    if (isCorrect) {
      setStreak((prev) => {
        const nextStreak = prev + 1;
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);
        return nextStreak;
      });
      setFeedback({ type: "correct" });
    } else {
      setStreak(0);
      setFeedback({ type: "wrong" });
    }
  };

  // Move to Next Question or Submit Game
  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLocked(false);
      setFeedback(null);
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

  // RESULT SCREEN AFTER SUBMIT
  if (result) {
    const accuracy =
      result.totalCount > 0
        ? Math.round((result.correctCount / result.totalCount) * 100)
        : 0;

    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 animate-in fade-in zoom-in duration-300">
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

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface p-6 md:p-8 text-center shadow-card">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4 shadow-2xs">
            <Trophy className="w-8 h-8 transition-transform hover:scale-105 duration-300" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground font-display">
            Hoàn Thành Bài Test!
          </h2>
          <p className="text-sm text-muted mt-1">{attempt.set.title}</p>

          <div className="grid grid-cols-3 gap-3 md:gap-4 my-6">
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-4 text-center shadow-xs">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                Số Câu Đúng
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-primary font-display">
                {result.correctCount}/{result.totalCount}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">câu trả lời đúng</span>
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
                {accuracy}%
              </span>
              <span className="text-[10px] text-muted block mt-0.5">
                {accuracy >= 80 ? "Xuất sắc" : accuracy >= 50 ? "Khá tốt" : "Cần cố gắng"}
              </span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface/80 p-4 text-center shadow-xs">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                Thời Gian
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-foreground font-display">
                {formatDuration(result.durationSec)}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">
                Chuỗi đúng: {maxStreak} câu
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2 font-bold px-6 py-2.5 rounded-xl text-sm"
            >
              <RotateCcw className="h-4 w-4" /> Làm lại bài test
            </Button>
            <Link href="/community?tab=events">
              <Button className="gap-2 font-bold px-6 py-2.5 rounded-xl text-sm bg-primary text-primary-foreground shadow-md">
                Khám phá bài test khác <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-foreground font-display">
            Xem lại chi tiết từng câu hỏi ({result.review.length})
          </h3>

          <div className="space-y-3">
            {result.review.map((item, idx) => {
              const isCorrect = item.isCorrect;
              return (
                <div
                  key={item.questionId}
                  className={cn(
                    "p-5 rounded-2xl border transition-all text-sm space-y-3 shadow-xs",
                    isCorrect
                      ? "bg-emerald-50/30 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-rose-50/30 border-rose-200 dark:border-rose-900/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                          isCorrect ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-foreground">
                        {isCorrect ? "Chính xác" : "Chưa chính xác"}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                        isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {isCorrect ? "Đúng" : "Sai"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-surface border border-border/60">
                      <span className="text-muted block font-semibold mb-1">Đáp án bạn chọn:</span>
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

                    <div className="p-3 rounded-xl bg-surface border border-border/60">
                      <span className="text-muted block font-semibold mb-1">Đáp án đúng:</span>
                      <p className="font-bold text-sm text-emerald-600">
                        {OPTION_LETTERS[item.answerIndex]}. {item.options[item.answerIndex]}
                      </p>
                    </div>
                  </div>

                  {item.explanation && (
                    <div className="p-3 rounded-xl bg-muted/10 border border-border/40 text-xs text-muted">
                      <span className="font-bold text-foreground block mb-0.5">Giải thích:</span>
                      {item.explanation}
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

  // ACTIVE QUESTION VIEW
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 select-none">
      {/* HEADER BAR */}
      <div className="bg-surface rounded-3xl border border-border shadow-md p-5 md:p-6 space-y-4">
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
            {streak > 1 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs md:text-sm font-extrabold animate-pulse">
                <Flame className="w-4 h-4 md:w-5 md:h-5 fill-rose-500" />
                <span>{t("streak_multiplier", { count: streak })}</span>
              </div>
            )}
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
              {timeLeft}s
            </span>
          </div>

          <div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden p-0.5 border border-border/50">
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
      <div className="relative bg-surface rounded-3xl border border-border shadow-xl p-6 md:p-10 space-y-8 overflow-hidden">
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

        {currentQ?.passage && (
          <div className="p-5 rounded-2xl bg-muted/10 border border-border/60 text-base md:text-lg leading-relaxed text-foreground/90 font-medium">
            {currentQ.passage}
          </div>
        )}

        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug font-display">
          {currentQ?.prompt}
        </h2>

        {/* 4 ANSWER OPTIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 pt-2">
          {currentQ?.options.map((optText, optIdx) => {
            const isPicked = userAnswers[currentQ.id] === optIdx;
            const isCorrectOption =
              currentQ.answerIndex !== undefined && optIdx === currentQ.answerIndex;

            let cardStyle =
              "bg-surface hover:bg-muted/15 border-2 border-border text-foreground hover:border-primary/50 shadow-xs";
            let iconNode = null;

            if (isLocked) {
              if (isPicked && isCorrectOption) {
                // Người dùng chọn ĐÚNG -> Viền & Nền Xanh lá
                cardStyle =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-4 ring-emerald-300/60 scale-[1.01]";
                iconNode = (
                  <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md animate-in zoom-in duration-200">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </span>
                );
              } else if (isPicked && !isCorrectOption) {
                // Người dùng chọn SAI -> Viền & Nền ĐỎ
                cardStyle =
                  "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100 ring-4 ring-rose-300/60";
                iconNode = (
                  <span className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md animate-in zoom-in duration-200">
                    <X className="w-5 h-5 stroke-[3]" />
                  </span>
                );
              } else if (!isPicked && isCorrectOption) {
                // Hiển thị ĐÁP ÁN ĐÚNG chuẩn màu Xanh lá để người học biết đáp án đúng
                cardStyle =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-4 ring-emerald-300/40";
                iconNode = (
                  <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </span>
                );
              } else {
                // Các đáp án sai khác không được chọn -> Làm mờ
                cardStyle =
                  "bg-muted/10 text-muted/50 border border-border/40 opacity-40 grayscale cursor-not-allowed";
              }
            } else if (isPicked) {
              cardStyle = "bg-primary/10 border-2 border-primary text-foreground ring-2 ring-primary/30";
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelectOption(optIdx)}
                className={cn(
                  "relative min-h-[85px] md:min-h-[100px] p-5 md:p-6 rounded-2xl font-bold text-left transition-all transform active:scale-98 flex items-center justify-between gap-4 cursor-pointer",
                  cardStyle
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 border shadow-xs transition-colors",
                      isLocked && isCorrectOption
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : isLocked && isPicked && !isCorrectOption
                        ? "bg-rose-500 text-white border-rose-600"
                        : "bg-muted/20 text-foreground border-border/60"
                    )}
                  >
                    {OPTION_LETTERS[optIdx % 4]}
                  </span>
                  <span className="text-base md:text-lg leading-snug font-bold">
                    {optText}
                  </span>
                </div>

                {iconNode}
              </button>
            );
          })}
        </div>

        {/* INSTANT FEEDBACK BAR */}
        {isLocked && (
          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {feedback?.type === "correct" ? (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-sm md:text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Chính xác!</span>
              </div>
            ) : feedback?.type === "timeout" ? (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold text-sm md:text-base">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>
                  Hết giờ! {currentQ?.answerIndex !== undefined && `Đáp án đúng là: ${OPTION_LETTERS[currentQ.answerIndex]}. ${currentQ.options[currentQ.answerIndex]}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold text-sm md:text-base">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>
                  Chưa chính xác! {currentQ?.answerIndex !== undefined && `Đáp án đúng là: ${OPTION_LETTERS[currentQ.answerIndex]}. ${currentQ.options[currentQ.answerIndex]}`}
                </span>
              </div>
            )}

            <Button
              disabled={submitting}
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  <span>{t("next_question")}</span>
                  <ChevronRight className="w-4 h-4" />
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
