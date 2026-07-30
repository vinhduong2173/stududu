"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Award, CheckCircle2, FileText, HelpCircle, XCircle, X, AlertCircle } from "lucide-react";

interface Question {
  id: number;
  order: number;
  questionText: string;
  type: "multiple_choice" | "essay";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface QuizDetail {
  id: number;
  title: string;
  description?: string;
  creator?: { displayName: string };
  questions: Question[];
}

interface QuizSubmissionResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  breakdown: Array<{
    questionId: number;
    order: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    explanation?: string;
    isCorrect: boolean;
  }>;
}

interface QuizTakeModalProps {
  quizId: number | null;
  open: boolean;
  onClose: () => void;
  onSubmitted?: (result: QuizSubmissionResult) => void;
  onQuizNotFound?: (quizId: number) => void;
}

export function QuizTakeModal({ quizId, open, onClose, onSubmitted, onQuizNotFound }: QuizTakeModalProps) {
  const [quiz, setQuiz] = React.useState<QuizDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<QuizSubmissionResult | null>(null);
  const [quizError, setQuizError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!quizId || !open) return;
    setLoading(true);
    setResult(null);
    setQuizError(null);
    setAnswers({});

    api<QuizDetail>(`/quiz/${quizId}`)
      .then(setQuiz)
      .catch((err: any) => {
        const msg = err.message || "Đề thi này đã bị người tạo xóa hoặc không còn tồn tại.";
        setQuizError(msg);
        if (onQuizNotFound) onQuizNotFound(quizId);
      })
      .finally(() => setLoading(false));
  }, [quizId, open, onQuizNotFound]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!quizId) return;
    setSubmitting(true);
    try {
      const res = await api<QuizSubmissionResult>(`/quiz/${quizId}/submit`, {
        method: "POST",
        body: { answers },
      });
      setResult(res);
      if (onSubmitted) onSubmitted(res);
    } catch (err: any) {
      alert(err.message || "Nộp bài thi thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-quiz-taking="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground truncate">{quizError ? "Lỗi đề thi" : quiz?.title || "Làm bài thi"}</h2>
              <p className="text-xs text-muted">
                {quiz?.creator?.displayName ? `Tạo bởi ${quiz.creator.displayName}` : "Bộ đề thi"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground rounded-full hover:bg-muted/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="p-12 text-center text-muted animate-pulse">Đang tải nội dung đề thi...</div>
          ) : quizError ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Đề Thi Đã Bị Xóa</h3>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                {quizError}
              </p>
              <Button size="sm" onClick={onClose} className="rounded-xl">
                Đóng
              </Button>
            </div>
          ) : result ? (
            /* Result Screen */
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 text-center space-y-2">
                <Award className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-2xl font-extrabold text-foreground">Kết Quả Bài Thi</h3>
                <div className="text-4xl font-black text-primary">{result.score}%</div>
                <p className="text-sm font-medium text-muted">
                  Đúng {result.correctCount} / {result.totalQuestions} câu hỏi
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Chi Tiết Đáp Án</h4>
                {result.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${
                      item.isCorrect ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
                    } space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-foreground">
                        Câu {idx + 1}: {item.questionText}
                      </span>
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Đúng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-error shrink-0">
                          <XCircle className="w-4 h-4" /> Sai
                        </span>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-muted">Bạn chọn:</span>{" "}
                        <span className="font-semibold text-foreground">{item.userAnswer || "(bỏ trống)"}</span>
                      </p>
                      <p>
                        <span className="text-muted">Đáp án đúng của người tạo đề:</span>{" "}
                        <span className="font-bold text-success">{item.correctAnswer}</span>
                      </p>
                      {item.explanation && (
                        <p className="text-muted pt-1 italic">Ghi chú: {item.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Questions Form */
            <div className="space-y-6">
              {quiz?.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl border border-border bg-muted/5 space-y-3">
                  <div className="font-semibold text-foreground text-sm flex items-start gap-2">
                    <span className="text-primary font-bold">Câu {idx + 1}:</span>
                    <span>{q.questionText}</span>
                  </div>

                  {q.type === "multiple_choice" && q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-6">
                      {q.options.map((opt, optIdx) => {
                        const optKey = opt.charAt(0).toUpperCase();
                        const isSelected = answers[q.id] === optKey;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: optKey }))
                            }
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-border bg-surface text-foreground hover:border-primary/50"
                            }`}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                      placeholder="Nhập câu trả lời tự luận của bạn..."
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
          <Button variant="outline" size="sm" onClick={onClose}>
            {result || quizError ? "Đóng" : "Hủy"}
          </Button>

          {!result && !quizError && (
            <Button size="sm" onClick={() => void handleSubmit()} disabled={submitting || loading}>
              {submitting ? "Đang chấm điểm..." : "Nộp Bài Thi"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
