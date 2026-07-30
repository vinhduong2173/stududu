"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { FileText, Sparkles, Upload, X, CheckCircle2, AlertCircle, Plus, Trash2, Edit3, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export interface ParsedQuestion {
  questionText: string;
  type: "multiple_choice" | "essay";
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function QuizCreateModal({ open, onClose, onSaved }: QuizCreateModalProps) {
  const t = useTranslations();
  const [step, setStep] = React.useState<"input" | "review">("input");
  const [file, setFile] = React.useState<File | null>(null);
  const [rawText, setRawText] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Review & Editor states
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [questions, setQuestions] = React.useState<ParsedQuestion[]>([]);
  const [errorMsg, setErrorMsg] = React.useState("");

  if (!open) return null;

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

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quiz/parse-file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
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
      setStep("review");
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
    setStep("review");
  };

  const handleAddQuestion = (type: "multiple_choice" | "essay" = "multiple_choice") => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: `Câu hỏi ${prev.length + 1}`,
        type,
        options: type === "multiple_choice" ? ["A. Phương án 1", "B. Phương án 2", "C. Phương án 3", "D. Phương án 4"] : [],
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
        options: type === "multiple_choice" ? (current.options.length > 0 ? current.options : ["A. Phương án 1", "B. Phương án 2", "C. Phương án 3", "D. Phương án 4"]) : [],
        correctAnswer: type === "multiple_choice" ? (current.correctAnswer || "A") : "Đáp án câu hỏi tự luận",
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
      await api("/quiz", {
        method: "POST",
        body: { title, description, questions },
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Lưu bộ đề thi thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Soạn Thảo & Tạo Bộ Đề Thi</h2>
              <p className="text-xs text-muted">Trắc nghiệm & Tự luận — Tự do chỉnh sửa câu hỏi & đáp án</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground rounded-full hover:bg-muted/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 text-error text-sm font-medium border border-error/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {step === "input" ? (
            <div className="space-y-6">
              {/* Option 1: File PDF upload zone */}
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/5">
                <input
                  type="file"
                  accept=".pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {file ? file.name : "Tải lên file PDF đề thi"}
                  </span>
                  <span className="text-xs text-muted">Bấm để chọn file PDF hoặc dán nội dung phía dưới</span>
                </label>
              </div>

              <div className="relative flex items-center justify-center">
                <span className="bg-surface px-3 text-xs text-muted font-medium uppercase">hoặc</span>
                <div className="absolute inset-0 border-t border-border -z-10" />
              </div>

              {/* Option 2: Text input zone */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Dán nội dung văn bản đề thi</label>
                <textarea
                  rows={5}
                  className="w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary"
                  placeholder="Dán câu hỏi trắc nghiệm A, B, C, D hoặc đề thi tự luận tại đây..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              {/* Option 3: Manual Exam Creation Button */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Muốn tự gõ đề thi từ đầu?</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleStartManual}>
                  Tự Soạn Đề Thủ Công
                </Button>
              </div>
            </div>
          ) : (
            /* Review & Full Editor step */
            <div className="space-y-6">
              <div className="space-y-3 bg-muted/5 p-4 rounded-2xl border border-border">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">Thông tin đề thi</label>
                <input
                  className="w-full text-xl font-bold text-foreground bg-transparent border-b border-border pb-2 outline-none focus:border-primary"
                  placeholder="Tiêu đề đề thi (VD: Kiểm tra Tiếng Anh Khóa 10)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  className="w-full text-sm text-muted bg-transparent outline-none"
                  placeholder="Mô tả ngắn đề thi (không bắt buộc)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Danh sách câu hỏi ({questions.length} câu)
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAddQuestion("multiple_choice")} className="rounded-xl text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Trắc nghiệm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddQuestion("essay")} className="rounded-xl text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Tự luận
                    </Button>
                  </div>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-border bg-surface shadow-sm space-y-4 relative group">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-primary text-sm">Câu {idx + 1}:</span>
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => updateQuestionType(idx, "multiple_choice")}
                            className={`px-3 py-1 rounded-lg transition-all ${
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
                            className={`px-3 py-1 rounded-lg transition-all ${
                              q.type === "essay"
                                ? "bg-primary text-white shadow-sm font-bold"
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
                        className="p-2 rounded-xl text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question text */}
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">Nội dung câu hỏi:</label>
                      <textarea
                        rows={2}
                        className="w-full text-sm font-semibold text-foreground bg-muted/10 p-2.5 rounded-xl border border-border outline-none focus:border-primary resize-none"
                        value={q.questionText}
                        onChange={(e) => updateQuestionText(idx, e.target.value)}
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </div>

                    {/* Multiple Choice Options vs Essay Answer */}
                    {q.type === "multiple_choice" ? (
                      <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted">
                          <span>Phương án trắc nghiệm (Nhấp tròn để chọn ĐÁP ÁN ĐÚNG):</span>
                          <button
                            type="button"
                            onClick={() => handleAddOption(idx)}
                            className="text-primary hover:underline text-[11px] font-bold"
                          >
                            + Thêm lựa chọn
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const optionKey = opt.charAt(0).toUpperCase();
                            const isCorrect = q.correctAnswer.toUpperCase().startsWith(optionKey);

                            return (
                              <div key={optIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuestionAnswer(idx, optionKey)}
                                  className={`p-2 rounded-xl border transition-all shrink-0 ${
                                    isCorrect
                                      ? "border-success bg-success text-white font-bold"
                                      : "border-border bg-muted/10 text-muted hover:border-primary"
                                  }`}
                                  title="Đánh dấu đáp án đúng"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <input
                                  className="w-full text-xs font-medium text-foreground bg-background px-3 py-2 rounded-xl border border-border outline-none focus:border-primary"
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
                      /* Essay correct answer input */
                      <div className="space-y-2 pl-4 border-l-2 border-indigo-500/30 bg-indigo-500/5 p-3 rounded-r-xl">
                        <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Đáp án đúng / Lời giải mẫu (Tự luận):
                        </label>
                        <textarea
                          rows={2}
                          className="w-full text-xs font-semibold text-foreground bg-background p-2.5 rounded-xl border border-border outline-none focus:border-indigo-500"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestionAnswer(idx, e.target.value)}
                          placeholder="Nhập đáp án đúng chuẩn hoặc từ khóa mẫu..."
                        />
                      </div>
                    )}

                    {/* Explanation / Notes */}
                    <div className="pt-1">
                      <input
                        className="w-full text-xs text-muted bg-transparent border-b border-border/50 pb-1 outline-none focus:border-primary"
                        placeholder="Giải thích đáp án / Ghi chú cho người làm bài (không bắt buộc)..."
                        value={q.explanation || ""}
                        onChange={(e) => updateQuestionExplanation(idx, e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleAddQuestion("multiple_choice")} className="flex-1 py-3 rounded-2xl border-dashed">
                    <Plus className="w-4 h-4 mr-1.5" /> Thêm câu Trắc Nghiệm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAddQuestion("essay")} className="flex-1 py-3 rounded-2xl border-dashed">
                    <Plus className="w-4 h-4 mr-1.5" /> Thêm câu Tự Luận
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
          {step === "review" ? (
            <Button variant="outline" size="sm" onClick={() => setStep("input")}>
              Quay lại
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy
            </Button>
            {step === "input" ? (
              <Button size="sm" onClick={() => void handleParse()} disabled={parsing}>
                {parsing ? "AI Đang đọc đề..." : "Bóc Tách Bằng AI"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => void handleSaveQuiz()} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu Bộ Đề Thi"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
