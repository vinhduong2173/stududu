import * as React from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { QuizSetItem } from "@/hooks/useQuizzesList";

interface QuizzesStatsCardsProps {
  quizSets: QuizSetItem[];
}

export function QuizzesStatsCards({ quizSets }: QuizzesStatsCardsProps) {
  const totalSets = quizSets.length;
  const totalQuestions = quizSets.reduce((sum, s) => sum + (s.wordCount || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Thẻ 1: Tổng số bộ đề */}
      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface p-6 shadow-xs transition-shadow hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Tổng số bộ đề
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-foreground">{totalSets}</p>
            <span className="text-sm font-semibold text-muted">bộ đề</span>
          </div>
          <p className="text-xs text-muted/80">
            Tổng hợp các bộ đề trắc nghiệm đã tạo
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
          <BookOpen className="h-7 w-7" />
        </div>
      </div>

      {/* Thẻ 2: Tổng số câu hỏi & từ vựng */}
      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface p-6 shadow-xs transition-shadow hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Tổng số câu hỏi &amp; từ vựng
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {totalQuestions}
            </p>
            <span className="text-sm font-semibold text-muted">câu hỏi</span>
          </div>
          <p className="text-xs text-muted/80">
            Dữ liệu câu hỏi đang hoạt động trên hệ thống
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
