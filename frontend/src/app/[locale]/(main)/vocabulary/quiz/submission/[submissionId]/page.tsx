"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  FileText,
  HelpCircle,
  XCircle,
  Sparkles,
  AlertCircle,
  Save,
  UserCheck,
  Plus,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/features/TrustDialogs";
import { WordSaveModal } from "@/components/features/WordSaveModal";
import { TranslationModal } from "@/components/features/TranslationModal";

interface SubmissionDetail {
  submissionId: number;
  quizId: number;
  quizTitle: string;
  creatorId: number;
  creatorName: string;
  isCreator: boolean;
  isStudent: boolean;
  studentName: string;
  studentAvatar?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  feedback?: string;
  questionFeedbacks: Record<string, string>;
  breakdown: Array<{
    questionId: number;
    order: number;
    questionText: string;
    type: "multiple_choice" | "essay";
    options: string[];
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { show: showToast, toast } = useToast();

  const submissionId = Number(params?.submissionId);
  const [detail, setDetail] = React.useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingFeedback, setSavingFeedback] = React.useState(false);
  const [feedbackInput, setFeedbackInput] = React.useState("");
  const [questionFeedbackInputs, setQuestionFeedbackInputs] = React.useState<Record<string, string>>({});
  const [savingQFeedback, setSavingQFeedback] = React.useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // AI Explain states
  const [aiExplains, setAiExplains] = React.useState<Record<number, AiExplainResult>>({});
  const [loadingAiExplain, setLoadingAiExplain] = React.useState<Record<number, boolean>>({});
  const [wordSaveTarget, setWordSaveTarget] = React.useState<string | null>(null);
  const [selectedText, setSelectedText] = React.useState<string>("");
  const [selectionPos, setSelectionPos] = React.useState<{ x: number; y: number } | null>(null);
  const [translateTarget, setTranslateTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!submissionId) return;
    setLoading(true);
    setErrorMsg(null);

    api<SubmissionDetail>(`/quiz/submission/${submissionId}`)
      .then((res) => {
        setDetail(res);
        setFeedbackInput(res.feedback || "");
        setQuestionFeedbackInputs(res.questionFeedbacks || {});
      })
      .catch((err: any) => setErrorMsg(err.message || "Không thể tải chi tiết bài làm"))
      .finally(() => setLoading(false));
  }, [submissionId]);

  // Text selection handler for translate
  React.useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (text.length > 1) {
        const range = sel?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelectedText(text);
          setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 48 });
        }
      } else {
        setSelectedText("");
        setSelectionPos(null);
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleSaveFeedback = async () => {
    if (!submissionId) return;
    setSavingFeedback(true);
    try {
      await api(`/quiz/submission/${submissionId}/feedback`, {
        method: "POST",
        body: { feedback: feedbackInput },
      });
      showToast("Đã lưu nhận xét tổng quan cho học viên!");
      if (detail) setDetail({ ...detail, feedback: feedbackInput });
    } catch (err: any) {
      showToast(err.message || "Lưu nhận xét thất bại");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleSaveQuestionFeedback = async (questionId: number) => {
    if (!submissionId) return;
    setSavingQFeedback((prev) => ({ ...prev, [questionId]: true }));
    try {
      await api(`/quiz/submission/${submissionId}/feedback`, {
        method: "POST",
        body: { questionFeedbacks: { [questionId]: questionFeedbackInputs[questionId] || "" } },
      });
      showToast("Đã lưu nhận xét cho câu hỏi này!");
      if (detail) {
        setDetail({
          ...detail,
          questionFeedbacks: {
            ...detail.questionFeedbacks,
            [questionId]: questionFeedbackInputs[questionId] || "",
          },
        });
      }
    } catch (err: any) {
      showToast(err.message || "Lưu nhận xét thất bại");
    } finally {
      setSavingQFeedback((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleFetchAiExplain = async (q: SubmissionDetail["breakdown"][0]) => {
    setLoadingAiExplain((prev) => ({ ...prev, [q.questionId]: true }));
    try {
      const res = await api<AiExplainResult>("/quiz/explain-question", {
        method: "POST",
        body: {
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer || "A",
          userAnswer: q.userAnswer,
        },
      });
      setAiExplains((prev) => ({ ...prev, [q.questionId]: res }));
    } catch (err: any) {
      showToast(err.message || "AI giải đáp thất bại");
    } finally {
      setLoadingAiExplain((prev) => ({ ...prev, [q.questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-muted font-semibold animate-pulse">
        Đang tải kết quả bài làm...
      </div>
    );
  }

  if (errorMsg || !detail) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Không Thể Tải Kết Quả</h2>
        <p className="text-xs text-muted max-w-sm">{errorMsg || "Bài làm thi không tồn tại hoặc đã bị xóa."}</p>
        <Button onClick={() => router.push("/inbox")}>Quay về Tin Nhắn</Button>
      </div>
    );
  }

  const scoreColor =
    detail.score >= 80 ? "text-green-500" : detail.score >= 50 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Text selection translate popup */}
      {selectedText && selectionPos && (
        <div
          style={{ position: "absolute", left: selectionPos.x, top: selectionPos.y, transform: "translateX(-50%)", zIndex: 9999 }}
          className="flex gap-2 bg-surface border border-border rounded-2xl shadow-xl px-3 py-2"
        >
          <button
            className="text-xs font-bold text-primary"
            onClick={() => { setTranslateTarget(selectedText); setSelectedText(""); setSelectionPos(null); }}
          >
            🌐 Dịch
          </button>
          <button
            className="text-xs font-bold text-indigo-500"
            onClick={() => { setWordSaveTarget(selectedText); setSelectedText(""); setSelectionPos(null); }}
          >
            + Lưu từ
          </button>
        </div>
      )}

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/inbox" className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2 truncate">
              <Award className="w-5 h-5 text-primary shrink-0" />
              {detail.isCreator ? `Bài Làm Của ${detail.studentName}` : "Kết Quả Bài Thi Của Bạn"}
            </h1>
            <p className="text-xs text-muted">
              {detail.quizTitle} • <span className={`font-bold ${scoreColor}`}>{detail.score}%</span>{" "}
              ({detail.correctCount}/{detail.totalQuestions} câu)
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push("/inbox")} className="rounded-2xl font-bold">
          Quay lại Chat
        </Button>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Score Header Card */}
        <div className="p-8 rounded-3xl bg-surface border-2 border-primary/30 text-center space-y-3 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            {detail.isCreator ? `Bài Làm Của ${detail.studentName}` : "Kết Quả Của Bạn"}
          </h2>
          <div className={`text-5xl font-black ${scoreColor}`}>{detail.score}%</div>
          <p className="text-sm font-semibold text-muted">
            Đúng {detail.correctCount} / {detail.totalQuestions} câu hỏi
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <Clock className="w-3.5 h-3.5" />
            Nộp lúc {formatTime(detail.submittedAt)}
          </div>
          {detail.isStudent && (
            <p className="text-xs text-muted pt-1">
              Người ra đề: <span className="font-bold text-foreground">{detail.creatorName}</span>
            </p>
          )}
        </div>

        {/* Creator Overall Feedback Box */}
        {detail.isCreator ? (
          <div className="bg-surface p-6 rounded-3xl border-2 border-indigo-500/30 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-5 h-5" /> Nhận Xét Tổng Quan Dành Cho Học Viên
            </div>
            <p className="text-xs text-muted">
              Ghi lại nhận xét chung, lời khuyên tổng thể cho {detail.studentName}. Bạn cũng có thể nhận xét từng câu bên dưới.
            </p>
            <textarea
              rows={3}
              className="w-full text-sm font-medium text-foreground bg-background p-4 rounded-2xl border border-border outline-none focus:border-indigo-500"
              placeholder="Nhập nhận xét tổng quan (VD: Em cần chú ý hơn về thì quá khứ)..."
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
            />
            <Button
              onClick={() => void handleSaveFeedback()}
              disabled={savingFeedback}
              className="rounded-2xl font-bold bg-indigo-600 text-white px-6 shadow-md"
            >
              <Save className="w-4 h-4 mr-2" /> {savingFeedback ? "Đang Lưu..." : "Lưu Nhận Xét Tổng Quan"}
            </Button>
          </div>
        ) : (
          /* Student viewing creator overall feedback */
          detail.feedback && (
            <div className="bg-surface p-6 rounded-3xl border-2 border-indigo-500/30 shadow-md space-y-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" /> Nhận Xét Tổng Quan Từ {detail.creatorName}:
              </div>
              <p className="text-sm text-foreground font-medium italic leading-relaxed">{detail.feedback}</p>
            </div>
          )
        )}

        {/* Question Breakdown */}
        <div className="space-y-6">
          <h3 className="text-base font-extrabold text-foreground uppercase tracking-wider">Chi Tiết Bài Làm</h3>

          {detail.breakdown.map((item, idx) => {
            const qFeedback = detail.questionFeedbacks?.[item.questionId] || "";
            const qFeedbackInput = questionFeedbackInputs[item.questionId] ?? qFeedback;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl border-2 shadow-sm space-y-4 ${
                  item.isCorrect ? "border-success/40 bg-surface" : "border-error/40 bg-surface"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <span className="font-extrabold text-foreground text-base">
                    Câu {idx + 1}: {item.questionText}
                  </span>
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

                {/* Options (multiple choice) */}
                {item.type === "multiple_choice" && item.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.map((opt, oIdx) => {
                      const optLabel = opt.charAt(0).toUpperCase();
                      const isUserChoice = item.userAnswer?.toUpperCase().charAt(0) === optLabel;
                      const isCorrectOpt = item.correctAnswer?.toUpperCase().charAt(0) === optLabel;
                      return (
                        <div
                          key={oIdx}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                            isCorrectOpt
                              ? "border-success bg-success/10 text-success"
                              : isUserChoice && !isCorrectOpt
                              ? "border-error bg-error/10 text-error"
                              : "border-border text-muted"
                          }`}
                        >
                          {isCorrectOpt ? "✓ " : isUserChoice && !isCorrectOpt ? "✗ " : ""}{opt}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer details */}
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted">Trả lời của {detail.isCreator ? detail.studentName : "bạn"}:</span>{" "}
                    <span className="font-bold text-foreground bg-muted/20 px-2 py-1 rounded-lg">
                      {item.userAnswer || "(Không trả lời)"}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Đáp án đúng chuẩn:</span>{" "}
                    <span className="font-bold text-success bg-success/10 px-2 py-1 rounded-lg">{item.correctAnswer}</span>
                  </p>
                  {item.explanation && (
                    <p className="text-xs text-muted pt-1 italic">Ghi chú từ đề: {item.explanation}</p>
                  )}
                </div>

                {/* Per-question feedback (Teacher writes, student sees) */}
                {!item.isCorrect && (
                  <div className="pt-2 border-t border-border/40">
                    {detail.isCreator ? (
                      /* Creator: editable comment box */
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          <MessageSquare className="w-3.5 h-3.5" /> Nhận Xét Câu Này:
                        </div>
                        <textarea
                          rows={2}
                          className="w-full text-xs font-medium text-foreground bg-background p-3 rounded-xl border border-border outline-none focus:border-amber-500"
                          placeholder={`Nhận xét vì sao câu ${idx + 1} này sai (VD: Em chưa nắm vững thì hiện tại hoàn thành)...`}
                          value={qFeedbackInput}
                          onChange={(e) =>
                            setQuestionFeedbackInputs((prev) => ({ ...prev, [item.questionId]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          onClick={() => void handleSaveQuestionFeedback(item.questionId)}
                          disabled={savingQFeedback[item.questionId]}
                          className="rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          {savingQFeedback[item.questionId] ? "Đang lưu..." : "Lưu Nhận Xét Câu Này"}
                        </Button>
                      </div>
                    ) : qFeedback ? (
                      /* Student: read-only creator feedback for this question */
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Nhận xét từ {detail.creatorName}:
                        </div>
                        <p className="text-xs text-foreground font-medium italic">{qFeedback}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* AI Explain Button (both creator and student can use) */}
                <div className="pt-2">
                  {!aiExplains[item.questionId] ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleFetchAiExplain(item)}
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
                      <p className="text-xs font-medium text-foreground leading-relaxed whitespace-pre-line">
                        {aiExplains[item.questionId].explanation}
                      </p>
                      {aiExplains[item.questionId].phonetics && aiExplains[item.questionId].phonetics!.length > 0 && (
                        <div className="pt-2 border-t border-indigo-500/20 space-y-2">
                          <span className="text-[11px] font-bold text-muted uppercase">Từ vựng & Phiên âm IPA trong câu:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {aiExplains[item.questionId].phonetics!.map((pItem, pIdx) => (
                              <div key={pIdx} className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-foreground">{pItem.word}</span>{" "}
                                  <span className="text-muted font-mono text-[11px]">{pItem.ipa}</span>
                                  <p className="text-muted text-[11px]">{pItem.meaning}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setWordSaveTarget(pItem.word)}
                                  className="p-1 h-auto text-primary"
                                  title="Lưu từ vựng này"
                                >
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
            );
          })}
        </div>
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

      {translateTarget && (
        <TranslationModal
          initialText={translateTarget}
          open={!!translateTarget}
          onClose={() => setTranslateTarget(null)}
        />
      )}

      {toast}
    </div>
  );
}
