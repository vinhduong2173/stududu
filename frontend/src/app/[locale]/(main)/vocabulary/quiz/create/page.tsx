"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  FileText,
  Save,
  RotateCcw,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/features/TrustDialogs";

export interface ParsedQuestion {
  questionText: string;
  type: "multiple_choice" | "essay";
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

function QuizCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { show: showToast, toast } = useToast();

  const [step, setStep] = React.useState<"input" | "editor">("input");
  const [file, setFile] = React.useState<File | null>(null);
  const [rawText, setRawText] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadingQuiz, setLoadingQuiz] = React.useState(false);

  // Editor states
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [questions, setQuestions] = React.useState<ParsedQuestion[]>([]);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState<number>(0); // 0 = không giới hạn

  React.useEffect(() => {
    if (!editId) return;

    const fetchQuiz = async () => {
      setLoadingQuiz(true);
      try {
        const quiz = await api<any>(`/quiz/${editId}`);
        setTitle(quiz.title || "");
        setDescription(quiz.description || "");
        setTimeLimitMinutes(quiz.timeLimitMinutes || 0);
        if (quiz.questions && quiz.questions.length > 0) {
          setQuestions(
            quiz.questions.map((q: any) => ({
              questionText: q.questionText,
              type: q.type || "multiple_choice",
              options: Array.isArray(q.options) ? q.options : [],
              correctAnswer: q.correctAnswer || "A",
              explanation: q.explanation || "",
            })),
          );
        }
        setStep("editor");
      } catch (err: any) {
        setErrorMsg(err.message || "Không thể tải dữ liệu đề thi cần chỉnh sửa");
      } finally {
        setLoadingQuiz(false);
      }
    };

    void fetchQuiz();
  }, [editId]);

  const handleParse = async () => {
    setErrorMsg("");
    if (!file && !rawText.trim()) {
      setErrorMsg("Vui lòng tải lên file PDF hoặc dán văn bản đề thi");
      return;
    }

    setParsing(true);
    try {
      let res: { title: string; description?: string; questions: ParsedQuestion[] };

      if (file) {
        const token = localStorage.getItem("accessToken");
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quiz/parse-file`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );
        if (!uploadRes.ok) throw new Error("Phân tích file PDF thất bại");
        res = await uploadRes.json();
      } else {
        res = await api("/quiz/parse-text", {
          method: "POST",
          body: { text: rawText },
        });
      }

      setTitle(res.title || "Bộ đề thi AI");
      setDescription(res.description || "");
      setQuestions(
        (res.questions || []).map((q) => ({
          ...q,
          correctAnswer: q.correctAnswer || (q.options?.[0]?.charAt(0) ?? "A"),
        })),
      );
      setStep("editor");
    } catch (err: any) {
      setErrorMsg(err.message || "Không phân tích được đề thi");
    } finally {
      setParsing(false);
    }
  };

  const handleStartManual = () => {
    setTitle("Đề thi tự soạn");
    setDescription("");
    setQuestions([
      {
        questionText: "Câu hỏi 1",
        type: "multiple_choice",
        options: ["A. Phương án 1", "B. Phương án 2", "C. Phương án 3", "D. Phương án 4"],
        correctAnswer: "A",
        explanation: "",
      },
    ]);
    setErrorMsg("");
    setStep("editor");
  };

  const handleAddQuestion = (type: "multiple_choice" | "essay" = "multiple_choice") => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: `Câu hỏi ${prev.length + 1}`,
        type,
        options:
          type === "multiple_choice"
            ? ["A. Phương án 1", "B. Phương án 2", "C. Phương án 3", "D. Phương án 4"]
            : [],
        correctAnswer: type === "multiple_choice" ? "A" : "Lời giải mẫu...",
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestionType = (qIndex: number, type: "multiple_choice" | "essay") => {
    setQuestions((prev) => {
      const updated = [...prev];
      const current = updated[qIndex];
      updated[qIndex] = {
        ...current,
        type,
        options:
          type === "multiple_choice"
            ? current.options.length > 0
              ? current.options
              : ["A. Phương án 1", "B. Phương án 2", "C. Phương án 3", "D. Phương án 4"]
            : [],
        correctAnswer: type === "multiple_choice" ? current.correctAnswer || "A" : "Đáp án tự luận",
      };
      return updated;
    });
  };

  const updateQuestionText = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], questionText: text };
      return updated;
    });
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...(updated[qIndex].options || [])];
      opts[optIndex] = text;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const updateQuestionAnswer = (qIndex: number, answerKey: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correctAnswer: answerKey };
      return updated;
    });
  };

  const updateQuestionExplanation = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], explanation: text };
      return updated;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const currentOpts = updated[qIndex].options || [];
      const labels = ["A", "B", "C", "D", "E", "F", "G"];
      const nextLabel = labels[currentOpts.length] || `P${currentOpts.length + 1}`;
      updated[qIndex] = {
        ...updated[qIndex],
        options: [...currentOpts, `${nextLabel}. Phương án mới`],
      };
      return updated;
    });
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề đề thi");
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Bộ đề thi chưa có câu hỏi nào. Hãy thêm ít nhất 1 câu hỏi!");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api(`/quiz/${editId}`, {
          method: "PUT",
          body: { title, description, questions, timeLimitMinutes: timeLimitMinutes || null },
        });
        showToast("Cập nhật bộ đề thi thành công!");
      } else {
        await api("/quiz", {
          method: "POST",
          body: { title, description, questions, timeLimitMinutes: timeLimitMinutes || null },
        });
        showToast("Lưu bộ đề thi thành công!");
      }
      router.push("/vocabulary");
    } catch (err: any) {
      setErrorMsg(err.message || "Lưu bộ đề thi thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/vocabulary"
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> {editId ? "Chỉnh Sửa Bộ Đề Thi" : "Soạn Thảo & Tạo Bộ Đề Thi"}
            </h1>
            <p className="text-xs text-muted">
              {loadingQuiz
                ? "Đang tải dữ liệu đề thi..."
                : step === "input"
                ? "Bước 1: Chọn nguồn tài liệu hoặc soạn mới"
                : `Bước 2: Chỉnh sửa ${questions.length} câu hỏi & đáp án`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {step === "editor" && !editId && (
            <Button variant="outline" size="sm" onClick={() => setStep("input")} className="rounded-xl">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Tải Lại Nguồn Đề
            </Button>
          )}

          {step === "editor" ? (
            <Button
              onClick={() => void handleSaveQuiz()}
              disabled={saving || loadingQuiz}
              className="rounded-xl font-bold shadow-md bg-gradient-to-r from-primary to-indigo-600 text-white px-6"
            >
              <Save className="w-4 h-4 mr-2" /> {saving ? "Đang Lưu..." : editId ? "Cập Nhật Bộ Đề" : "Lưu Bộ Đề Thi"}
            </Button>
          ) : (
            <Button size="sm" onClick={() => void handleParse()} disabled={parsing} className="rounded-xl px-6">
              {parsing ? "AI Đang Đọc..." : "Bóc Tách Bằng AI"}
            </Button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-error/10 text-error text-sm font-medium border border-error/20 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === "input" ? (
          /* STEP 1: INPUT MODES */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: PDF Upload & Raw Text */}
            <div className="lg:col-span-2 space-y-6 bg-surface p-6 rounded-3xl border border-border shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Cách 1: AI Bóc Tách Tự Động Từ PDF / Văn Bản</h2>
                <p className="text-xs text-muted">Tải file PDF bài thi hoặc dán nội dung đề bài để AI phân tích câu hỏi tự động.</p>
              </div>

              {/* PDF Upload Dropzone */}
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/5">
                <input
                  type="file"
                  accept=".pdf"
                  id="pdf-page-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <label htmlFor="pdf-page-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-base text-foreground">
                    {file ? file.name : "Kéo thả hoặc Bấm để tải lên file PDF đề thi"}
                  </span>
                  <span className="text-xs text-muted max-w-sm">
                    Hỗ trợ các file đề thi Tiếng Anh, Toán, Văn... định dạng PDF.
                  </span>
                </label>
              </div>

              <div className="relative flex items-center justify-center">
                <span className="bg-surface px-3 text-xs text-muted font-bold uppercase">hoặc dán văn bản</span>
                <div className="absolute inset-0 border-t border-border -z-10" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted mb-2">Văn bản đề thi</label>
                <textarea
                  rows={8}
                  className="w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary"
                  placeholder="Dán nội dung các câu hỏi trắc nghiệm A, B, C, D hoặc đề bài tại đây..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              <Button
                onClick={() => void handleParse()}
                disabled={parsing}
                className="w-full h-12 rounded-2xl font-bold shadow-md bg-primary text-white"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {parsing ? "AI Đang Bóc Tách Đề Thi..." : "Bắt Đầu Bóc Tách Bằng AI"}
              </Button>
            </div>

            {/* Right 1 Col: Manual creation card */}
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Edit3 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Cách 2: Tự Soạn Đề Thủ Công</h2>
                <p className="text-xs text-muted leading-relaxed">
                  Dành riêng cho thầy cô hoặc người dùng muốn tự tay nhập tiêu đề, tự gõ từng câu hỏi Trắc nghiệm hoặc Tự luận từ đầu mà không dùng AI.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleStartManual}
                className="w-full h-12 rounded-2xl font-bold border-2 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <Plus className="w-5 h-5 mr-2" /> Tạo Đề Thủ Công Trống
              </Button>
            </div>
          </div>
        ) : (
          /* STEP 2: FULL-PAGE EDITOR */
          <div className="space-y-6">
            {/* Quiz Info Header Box */}
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Thông Tin Bộ Đề Thi</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <input
                    className="w-full text-2xl font-extrabold text-foreground bg-transparent border-b-2 border-border pb-2 outline-none focus:border-primary"
                    placeholder="Tiêu đề bộ đề thi (VD: Đề thi thử Tiếng Anh THPT Quốc Gia)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    className="w-full text-sm text-muted bg-transparent border-b-2 border-border/60 pb-2 outline-none focus:border-primary"
                    placeholder="Mô tả ngắn đề thi (VD: 40 câu trắc nghiệm)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Time Limit Selector */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase">
                  <Clock className="w-4 h-4" /> Thời Gian Làm Bài:
                </div>
                <div className="flex flex-wrap gap-2">
                  {[0, 10, 20, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeLimitMinutes(mins)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        timeLimitMinutes === mins
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/40"
                      }`}
                    >
                      {mins === 0 ? "Không giới hạn" : `${mins} phút`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions Editor Header */}
            <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border">
              <span className="font-extrabold text-base text-foreground">
                Danh Sách Câu Hỏi ({questions.length} câu)
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAddQuestion("multiple_choice")} className="rounded-xl font-bold">
                  <Plus className="w-4 h-4 mr-1 text-primary" /> + Trắc nghiệm
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAddQuestion("essay")} className="rounded-xl font-bold">
                  <Plus className="w-4 h-4 mr-1 text-indigo-500" /> + Tự luận
                </Button>
              </div>
            </div>

            {/* Questions List */}
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-surface p-6 rounded-3xl border-2 border-border shadow-sm space-y-5 transition-all hover:border-primary/40"
              >
                {/* Question Header & Type Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-primary bg-primary/10 px-3 py-1 rounded-xl">
                      Câu {idx + 1}
                    </span>
                    <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => updateQuestionType(idx, "multiple_choice")}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          q.type === "multiple_choice"
                            ? "bg-primary text-white shadow-sm font-bold"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Trắc nghiệm
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestionType(idx, "essay")}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          q.type === "essay"
                            ? "bg-indigo-600 text-white shadow-sm font-bold"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Tự luận
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-2 rounded-xl text-muted hover:text-error hover:bg-error/10 transition-colors self-end sm:self-auto"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Question Content Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted uppercase">Nội dung câu hỏi:</label>
                  <textarea
                    rows={3}
                    className="w-full text-base font-semibold text-foreground bg-muted/5 p-4 rounded-2xl border border-border outline-none focus:border-primary"
                    value={q.questionText}
                    onChange={(e) => updateQuestionText(idx, e.target.value)}
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </div>

                {/* Question Options OR Essay Answer */}
                {q.type === "multiple_choice" ? (
                  <div className="space-y-3 pl-4 border-l-4 border-primary/30 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-muted">
                      <span>Phương án trắc nghiệm (Bấm hình tròn để chọn ĐÁP ÁN ĐÚNG):</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(idx)}
                        className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(q.options || []).map((opt, optIdx) => {
                        const optionKey = opt.charAt(0).toUpperCase();
                        const isCorrect = q.correctAnswer.toUpperCase().startsWith(optionKey);

                        return (
                          <div key={optIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestionAnswer(idx, optionKey)}
                              className={`p-2.5 rounded-xl border-2 transition-all shrink-0 ${
                                isCorrect
                                  ? "border-success bg-success text-white font-bold shadow-sm"
                                  : "border-border bg-muted/10 text-muted hover:border-primary/50"
                              }`}
                              title="Đánh dấu đáp án đúng"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <input
                              className="w-full text-sm font-medium text-foreground bg-background px-4 py-2.5 rounded-xl border border-border outline-none focus:border-primary"
                              value={opt}
                              onChange={(e) => updateOptionText(idx, optIdx, e.target.value)}
                              placeholder={`Phương án ${optIdx + 1}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Essay Answer Input */
                  <div className="space-y-2 pl-4 border-l-4 border-indigo-500 bg-indigo-500/5 p-4 rounded-r-2xl">
                    <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      Đáp án đúng / Lời giải mẫu (Tự luận):
                    </label>
                    <textarea
                      rows={3}
                      className="w-full text-sm font-semibold text-foreground bg-background p-3.5 rounded-xl border border-border outline-none focus:border-indigo-500"
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestionAnswer(idx, e.target.value)}
                      placeholder="Nhập câu trả lời mẫu hoặc các từ khóa đáp án chuẩn..."
                    />
                  </div>
                )}

                {/* Explanation Input */}
                <div className="pt-2">
                  <input
                    className="w-full text-xs text-muted bg-transparent border-b border-border/60 pb-1.5 outline-none focus:border-primary"
                    placeholder="Giải thích đáp án / Ghi chú bổ sung (không bắt buộc)..."
                    value={q.explanation || ""}
                    onChange={(e) => updateQuestionExplanation(idx, e.target.value)}
                  />
                </div>
              </div>
            ))}

            {/* Bottom Add Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => handleAddQuestion("multiple_choice")}
                className="flex-1 py-4 rounded-2xl font-bold border-2 border-dashed"
              >
                <Plus className="w-5 h-5 mr-2 text-primary" /> Thêm Câu Trắc Nghiệm Mới
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddQuestion("essay")}
                className="flex-1 py-4 rounded-2xl font-bold border-2 border-dashed"
              >
                <Plus className="w-5 h-5 mr-2 text-indigo-500" /> Thêm Câu Tự Luận Mới
              </Button>
            </div>
          </div>
        )}
      </main>

      {toast}
    </div>
  );
}

export default function QuizCreatePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-6 text-muted font-semibold animate-pulse">Đang tải...</div>}>
      <QuizCreatePageContent />
    </React.Suspense>
  );
}
