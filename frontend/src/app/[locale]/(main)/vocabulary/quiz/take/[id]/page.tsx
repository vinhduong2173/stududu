"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  FileText,
  XCircle,
  Sparkles,
  AlertCircle,
  Send,
  BookOpen,
  Plus,
  Clock,
  LogOut,
} from "lucide-react";
import { WordSaveModal } from "@/components/features/WordSaveModal";
import { useToast } from "@/components/features/TrustDialogs";

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
  timeLimitMinutes?: number | null;
  creator?: { displayName: string };
  questions: Question[];
}

interface QuizSubmissionResult {
  submissionId: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  feedback?: string;
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

interface AiExplainResult {
  explanation: string;
  phonetics?: Array<{ word: string; ipa: string; meaning: string }>;
}

/** Confirm Dialog Component */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác Nhận",
  cancelLabel = "Hủy",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-surface rounded-3xl border border-border shadow-2xl p-8 max-w-sm w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${danger ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
          {danger ? <AlertCircle className="w-7 h-7" /> : <Send className="w-7 h-7" />}
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-2xl">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 rounded-2xl font-bold ${danger ? "bg-error text-white hover:bg-error/90" : ""}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuizTakePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show: showToast, toast } = useToast();

  const quizId = Number(params?.id);
  const conversationId = searchParams.get("conversationId") ? Number(searchParams.get("conversationId")) : undefined;

  const [quiz, setQuiz] = React.useState<QuizDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<QuizSubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Confirm dialogs
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);

  // Countdown timer
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [timeExpired, setTimeExpired] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Word save (no auto-translate — only manual "Lưu Từ" button)
  const [selectionSave, setSelectionSave] = React.useState<{ text: string; top: number; left: number } | null>(null);
  const [wordSaveTarget, setWordSaveTarget] = React.useState<string | null>(null);

  // AI Explain states
  const [aiExplains, setAiExplains] = React.useState<Record<number, AiExplainResult>>({});
  const [loadingAiExplain, setLoadingAiExplain] = React.useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    setErrorMsg(null);

    api<QuizDetail>(`/quiz/${quizId}`)
      .then((q) => {
        setQuiz(q);
        if (q.timeLimitMinutes && q.timeLimitMinutes > 0) {
          setTimeLeft(q.timeLimitMinutes * 60);
        }
      })
      .catch((err: any) => setErrorMsg(err.message || "Không tìm thấy hoặc đề thi đã bị xóa"))
      .finally(() => setLoading(false));
  }, [quizId]);

  // Countdown timer effect
  React.useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      setTimeExpired(true);
      void doSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, result]);

  // Text selection — only show Save Word, NO translate
  const handleMouseUp = React.useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setSelectionSave(null); return; }
    const raw = sel.toString().trim();
    if (!raw || raw.length > 80 || !/[a-zA-Z]/.test(raw)) { setSelectionSave(null); return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionSave({ text: raw, top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX + rect.width / 2 });
  }, []);

  const doSubmit = async () => {
    if (!quizId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await api<QuizSubmissionResult>(`/quiz/${quizId}/submit`, {
        method: "POST",
        body: { answers, conversationId },
      });
      setResult(res);
      showToast("Nộp bài thi thành công!");
    } catch (err: any) {
      setErrorMsg(err.message || "Nộp bài thi thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const handleFetchAiExplain = async (q: Question, userAnswer?: string) => {
    setLoadingAiExplain((prev) => ({ ...prev, [q.id]: true }));
    try {
      const res = await api<AiExplainResult>("/quiz/explain-question", {
        method: "POST",
        body: { questionText: q.questionText, options: q.options, correctAnswer: q.correctAnswer || "A", userAnswer },
      });
      setAiExplains((prev) => ({ ...prev, [q.id]: res }));
    } catch (err: any) {
      showToast(err.message || "AI giải đáp thất bại");
    } finally {
      setLoadingAiExplain((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-6 text-muted font-semibold animate-pulse">Đang tải đề thi...</div>;
  }

  if (errorMsg || !quiz) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Đề Thi Không Khả Dụng</h2>
        <p className="text-xs text-muted max-w-sm">{errorMsg || "Bộ đề thi này đã bị xóa hoặc không tồn tại."}</p>
        <Button onClick={() => router.push("/vocabulary")}>Quay lại Từ Vựng</Button>
      </div>
    );
  }

  const timerColor = timeLeft !== null && timeLeft <= 60 ? "text-error animate-pulse" : timeLeft !== null && timeLeft <= 300 ? "text-amber-500" : "text-foreground";

  return (
    <div className="min-h-screen bg-background pb-32" onMouseUp={!result ? handleMouseUp : undefined}>
      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showSubmitConfirm}
        title="Nộp Bài Thi?"
        message={`Bạn đã trả lời ${Object.keys(answers).length} / ${quiz.questions.length} câu. Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bạn sẽ không thể chỉnh sửa câu trả lời.`}
        confirmLabel="✅ Nộp Bài Thi"
        cancelLabel="Tiếp Tục Làm Bài"
        onConfirm={() => { setShowSubmitConfirm(false); void doSubmit(); }}
        onCancel={() => setShowSubmitConfirm(false)}
      />
      <ConfirmDialog
        open={showExitConfirm}
        title="Thoát Đề Thi?"
        message="Bài làm của bạn chưa được nộp. Nếu thoát, toàn bộ câu trả lời sẽ bị mất. Bạn có chắc chắn muốn thoát không?"
        confirmLabel="Thoát Ngay"
        cancelLabel="Tiếp Tục Làm Bài"
        danger
        onConfirm={() => { setShowExitConfirm(false); router.push(conversationId ? "/inbox" : "/vocabulary"); }}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* Floating Save Word Popup (no translate) */}
      {selectionSave && (
        <div
          className="fixed z-50 transform -translate-x-1/2 bg-surface/95 backdrop-blur-md border border-border shadow-xl rounded-2xl px-3 py-2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: Math.max(10, selectionSave.top - 50), left: selectionSave.left }}
        >
          <span className="text-xs font-bold text-foreground max-w-[120px] truncate">&quot;{selectionSave.text}&quot;</span>
          <Button
            size="sm"
            onClick={() => { setWordSaveTarget(selectionSave.text); setSelectionSave(null); }}
            className="rounded-xl h-8 text-xs font-bold px-2.5 bg-primary text-white"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Lưu Từ
          </Button>
        </div>
      )}

      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {!result ? (
            <button
              onClick={handleExitClick}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href={conversationId ? "/inbox" : "/vocabulary"} className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-primary shrink-0" /> {quiz.title}
            </h1>
            <p className="text-xs text-muted">
              {quiz.creator?.displayName ? `Tạo bởi ${quiz.creator.displayName}` : "Bộ đề thi AI"} • {quiz.questions.length} câu hỏi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown Timer */}
          {!result && timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border font-mono font-extrabold text-sm ${timerColor}`}>
              <Clock className="w-4 h-4" />
              {formatCountdown(timeLeft)}
            </div>
          )}

          {!result ? (
            <Button
              onClick={handleSubmitClick}
              disabled={submitting}
              className="rounded-2xl font-bold shadow-md bg-gradient-to-r from-primary to-indigo-600 text-white px-6 h-11"
            >
              <Send className="w-4 h-4 mr-2" /> {submitting ? "Đang Nộp..." : "Nộp Bài Thi"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push(conversationId ? "/inbox" : "/vocabulary")} className="rounded-2xl font-bold">
              Hoàn Thành & Quay Về
            </Button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {result ? (
          /* RESULT SCREEN */
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-surface border-2 border-primary/30 text-center space-y-3 shadow-lg">
              <Award className="w-16 h-16 text-primary mx-auto animate-bounce" />
              <h2 className="text-3xl font-black text-foreground">Kết Quả Bài Thi</h2>
              <div className="text-5xl font-black text-primary">{result.score}%</div>
              <p className="text-sm font-semibold text-muted">
                Bạn đã làm đúng <span className="text-success font-bold">{result.correctCount}</span> trên tổng số{" "}
                <span className="font-bold text-foreground">{result.totalQuestions}</span> câu hỏi
              </p>
              {result.feedback && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-left space-y-1 mt-4">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    💬 Ghi Chú & Nhận Xét Của Người Tạo Đề:
                  </span>
                  <p className="text-sm text-foreground font-medium italic">{result.feedback}</p>
                </div>
              )}

              {result.submissionId && (
                <Button
                  onClick={() => router.push(`/vocabulary/quiz/submission/${result.submissionId}`)}
                  className="mt-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-md"
                >
                  📄 Xem Chi Tiết Bài Làm & Nhận Xét
                </Button>
              )}
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-6">
              <h3 className="text-base font-extrabold text-foreground uppercase tracking-wider">Chi Tiết Kết Quả & Lời Giải</h3>

              {result.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl border-2 shadow-sm space-y-4 ${item.isCorrect ? "border-success/40 bg-surface" : "border-error/40 bg-surface"}`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                    <span className="font-extrabold text-foreground text-base">Câu {idx + 1}: {item.questionText}</span>
                    {item.isCorrect ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-success/10 text-success shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đúng
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-error/10 text-error shrink-0 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Sai
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted">Câu trả lời của bạn:</span>{" "}
                      <span className="font-bold text-foreground bg-muted/20 px-2 py-1 rounded-lg">{item.userAnswer || "(Chưa chọn)"}</span>
                    </p>
                    <p>
                      <span className="text-muted">Đáp án đúng chuẩn:</span>{" "}
                      <span className="font-bold text-success bg-success/10 px-2 py-1 rounded-lg">{item.correctAnswer}</span>
                    </p>
                    {item.explanation && <p className="text-xs text-muted pt-1 italic">Ghi chú từ đề: {item.explanation}</p>}
                  </div>

                  <div className="pt-2">
                    {!aiExplains[item.questionId] ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleFetchAiExplain({ id: item.questionId, order: item.order, questionText: item.questionText, type: "multiple_choice", correctAnswer: item.correctAnswer }, item.userAnswer)}
                        disabled={loadingAiExplain[item.questionId]}
                        className="rounded-xl text-xs font-bold border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        {loadingAiExplain[item.questionId] ? "AI Đang Phân Tích..." : "🤖 AI Giải Đáp Chi Tiết & Phiên Âm Từ Vựng"}
                      </Button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" /> AI Giải Đáp Chi Tiết:
                        </div>
                        <p className="text-xs font-medium text-foreground leading-relaxed whitespace-pre-line">{aiExplains[item.questionId].explanation}</p>
                        {aiExplains[item.questionId].phonetics && aiExplains[item.questionId].phonetics!.length > 0 && (
                          <div className="pt-2 border-t border-indigo-500/20 space-y-2">
                            <span className="text-[11px] font-bold text-muted uppercase">Từ vựng & Phiên âm IPA trong câu:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {aiExplains[item.questionId].phonetics!.map((p, pIdx) => (
                                <div key={pIdx} className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-foreground">{p.word}</span>{" "}
                                    <span className="text-muted font-mono text-[11px]">{p.ipa}</span>
                                    <p className="text-muted text-[11px]">{p.meaning}</p>
                                  </div>
                                  <Button size="sm" variant="ghost" onClick={() => setWordSaveTarget(p.word)} className="p-1 h-auto text-primary">
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* QUESTION FORM */
          <div className="space-y-6">
            {timeExpired && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-error/10 text-error font-bold border border-error/20">
                <Clock className="w-5 h-5 shrink-0" /> Hết giờ làm bài! Bài thi đang được nộp tự động...
              </div>
            )}
            <div className="bg-surface p-4 rounded-2xl border border-border text-xs text-muted flex items-center justify-between">
              <span>💡 Mẹo: Bôi đen chữ tiếng Anh bất kỳ để nhanh lưu vào Sổ Từ Vựng.</span>
              <span className="font-bold text-foreground">Đã trả lời {Object.keys(answers).length} / {quiz.questions.length}</span>
            </div>

            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="bg-surface p-6 rounded-3xl border-2 border-border shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <span className="font-black text-primary text-base bg-primary/10 px-3 py-1 rounded-xl shrink-0">Câu {idx + 1}</span>
                  <div className="font-bold text-foreground text-base leading-relaxed">{q.questionText}</div>
                </div>

                {q.type === "multiple_choice" && q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-4">
                    {q.options.map((opt, optIdx) => {
                      const optKey = opt.charAt(0).toUpperCase();
                      const isSelected = answers[q.id] === optKey;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optKey }))}
                          className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold text-left border-2 transition-all ${
                            isSelected ? "border-primary bg-primary/10 text-primary font-bold shadow-md" : "border-border bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? "border-primary bg-primary text-white" : "border-border text-muted"}`}>
                            {optKey}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-2 pl-4">
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5">Câu trả lời tự luận:</label>
                    <textarea
                      rows={4}
                      className="w-full text-sm font-medium text-foreground bg-background p-4 rounded-2xl border border-border outline-none focus:border-primary"
                      placeholder="Nhập phần trả lời tự luận của bạn..."
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleExitClick}
                className="rounded-2xl font-bold border-2 border-error/30 text-error hover:bg-error/10"
              >
                <LogOut className="w-4 h-4 mr-2" /> Thoát Đề Thi
              </Button>
              <Button
                onClick={handleSubmitClick}
                disabled={submitting}
                className="flex-1 h-14 rounded-2xl font-extrabold text-base shadow-lg bg-gradient-to-r from-primary to-indigo-600 text-white"
              >
                <Send className="w-5 h-5 mr-2" /> {submitting ? "Đang Nộp..." : "Hoàn Thành & Nộp Bài Thi"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {wordSaveTarget && (
        <WordSaveModal
          initialWord={wordSaveTarget}
          source="manual"
          open={wordSaveTarget !== null}
          onClose={() => setWordSaveTarget(null)}
          onSaved={() => showToast(`Đã lưu "${wordSaveTarget}" vào Sổ từ vựng!`)}
        />
      )}

      {toast}
    </div>
  );
}
