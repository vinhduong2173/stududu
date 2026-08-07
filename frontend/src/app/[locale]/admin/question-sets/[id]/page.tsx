"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  PencilLine,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizQuestionCard } from "@/components/features/QuizQuestionCard";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EditQuestionModal } from "../_components/EditQuestionModal";
import { AdminTrial } from "../_components/AdminTrial";
import { GeneratePanel } from "../_components/GeneratePanel";
import { ManualQuestionForm } from "../_components/ManualQuestionForm";
import {
  PublishGate,
  QuestionSetDetail,
  REQUIRED_QUESTION_COUNT,
  TestQuestion,
} from "@/lib/questionSets";

function formatDateToInput(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputToIso(dateStr?: string | null, isEndOfDay = false): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const parts = dateStr.trim().split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  const d = isEndOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
  return d.toISOString();
}

export default function AdminQuestionSetEditorPage() {
  const params = useParams();
  const setId = Number(params?.id);

  const [set, setSet] = React.useState<QuestionSetDetail | null>(null);
  const [gate, setGate] = React.useState<PublishGate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);
  const [showTrial, setShowTrial] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const [editingQuestion, setEditingQuestion] = React.useState<TestQuestion | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  // Edit settings state
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editTimePerQuestionSec, setEditTimePerQuestionSec] = React.useState(15);
  const [editMaxAttempts, setEditMaxAttempts] = React.useState(0);
  const [editStartsAt, setEditStartsAt] = React.useState("");
  const [editEndsAt, setEditEndsAt] = React.useState("");

  // Chế độ soạn (bảng dữ liệu thô) vs xem trước (đúng giao diện học viên)
  const [previewMode, setPreviewMode] = React.useState(false);
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const openEditModal = () => {
    if (!set) return;
    setEditTitle(set.title || "");
    setEditDescription(set.description || "");
    setEditTimePerQuestionSec(set.timePerQuestionSec || 15);
    setEditMaxAttempts(set.maxAttempts || 0);
    setEditStartsAt(formatDateToInput(set.startsAt));
    setEditEndsAt(formatDateToInput(set.endsAt));
    setShowEditModal(true);
  };

  const handleSaveSettings = async () => {
    if (!set) return;
    setBusy(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await api(`/admin/question-sets/${setId}`, {
        method: "PATCH",
        body: {
          title: editTitle,
          description: editDescription,
          timePerQuestionSec: editTimePerQuestionSec,
          maxAttempts: editMaxAttempts > 0 ? editMaxAttempts : null,
          startsAt: parseInputToIso(editStartsAt, false),
          endsAt: parseInputToIso(editEndsAt, true),
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được cấu hình bộ đề");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSet = async () => {
    if (!set) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xoá bộ đề "${set.title}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }
    setBusy(true);
    try {
      await api(`/admin/question-sets/${setId}`, { method: "DELETE" });
      router.push("/admin/question-sets");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được bộ đề");
      setBusy(false);
    }
  };

  const load = React.useCallback(() => {
    if (!Number.isFinite(setId)) return;
    Promise.all([
      api<QuestionSetDetail>(`/admin/question-sets/${setId}`),
      api<PublishGate>(`/admin/question-sets/${setId}/publish-gate`),
    ])
      .then(([s, g]) => {
        setSet(s);
        setGate(g);
        setEditTitle(s.title || "");
        setEditDescription(s.description || "");
        setEditTimePerQuestionSec(s.timePerQuestionSec || 15);
        setEditMaxAttempts(s.maxAttempts || 0);
        setEditStartsAt(formatDateToInput(s.startsAt));
        setEditEndsAt(formatDateToInput(s.endsAt));
        setError(null);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setId]);

  React.useEffect(load, [load]);

  const act = async (path: string, label: string) => {
    setBusy(true);
    setError(null);
    try {
      await api(path, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Không ${label} được`);
    } finally {
      setBusy(false);
    }
  };

  const removeQuestion = async (questionId: number) => {
    setBusy(true);
    try {
      await api(`/admin/questions/${questionId}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được câu hỏi");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="py-20 text-center text-sm text-muted">Đang tải…</p>;
  }
  if (!set || !gate) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <BackLink />
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error ?? "Không tìm thấy bộ đề"}
        </p>
      </div>
    );
  }

  const remainingSlots = Math.max(0, REQUIRED_QUESTION_COUNT - gate.activeCount);
  const isPublished = set.status === "published";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{set.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {set.language.name} · {set.topic.name} · {set.framework} {set.level}
          </p>
        </div>
        {!isPublished && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={busy || !gate.canPublish}
              onClick={() => act(`/admin/question-sets/${setId}/publish`, "publish")}
            >
              <Send className="mr-2 h-4 w-4" /> Xuất bản (Publish)
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Cấu hình & Giới hạn bài test */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-xs">
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã lưu cấu hình bộ đề thành công!</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="font-bold text-foreground text-base">Cấu hình & Giới hạn bài test</h2>
            <p className="text-xs text-muted mt-0.5">Thiết lập thời gian làm bài, số lần làm bài và khoảng ngày cho phép thí sinh làm bài.</p>
          </div>
          <Button
            size="sm"
            disabled={busy}
            onClick={handleSaveSettings}
            className="bg-primary text-primary-foreground font-bold text-xs rounded-xl px-5 py-2 shadow-xs"
          >
            Lưu cấu hình
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Tiêu đề bộ đề
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Mô tả
            </label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Thời gian cho mỗi câu hỏi ⏱️
            </label>
            <select
              value={editTimePerQuestionSec}
              onChange={(e) => setEditTimePerQuestionSec(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={10}>10 giây / câu (Rất nhanh)</option>
              <option value={15}>15 giây / câu (Tiêu chuẩn)</option>
              <option value={20}>20 giây / câu (Trung bình)</option>
              <option value={30}>30 giây / câu (Thoải mái)</option>
              <option value={60}>60 giây / câu (Nâng cao/Đọc hiểu)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Giới hạn số lần làm bài 🎯
            </label>
            <select
              value={editMaxAttempts}
              onChange={(e) => setEditMaxAttempts(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={0}>Không giới hạn</option>
              <option value={1}>1 lần duy nhất</option>
              <option value={2}>2 lần</option>
              <option value={3}>3 lần</option>
              <option value={5}>5 lần</option>
              <option value={10}>10 lần</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Ngày bắt đầu 📅 <span className="text-muted font-normal">(tùy chọn)</span>
            </label>
            <input
              type="date"
              value={editStartsAt}
              onChange={(e) => setEditStartsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Ngày kết thúc ⏳ <span className="text-muted font-normal">(tùy chọn)</span>
            </label>
            <input
              type="date"
              value={editEndsAt}
              onChange={(e) => setEditEndsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Thêm câu hỏi */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground text-lg">
          Danh sách câu hỏi (Hiện có {gate.activeCount} câu)
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setShowManual(true)}>
          <Plus className="mr-2 h-4 w-4" /> Thêm câu thủ công
        </Button>
      </div>
      <GeneratePanel
        setId={setId}
        remainingSlots={100}
        onImported={load}
      />

      {/* Danh sách câu đã có */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">
            Câu hỏi trong bộ ({set.questions.length})
          </h2>
          {set.questions.length > 0 && (
            <Button
              variant={previewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode((v) => !v)}
            >
              {previewMode ? (
                <>
                  <PencilLine className="mr-2 h-4 w-4" /> Về chế độ soạn
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" /> Xem như học viên
                </>
              )}
            </Button>
          )}
        </div>

        {set.questions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Chưa có câu hỏi nào. Tải tài liệu lên để AI sinh nháp, hoặc thêm thủ công.
          </p>
        ) : previewMode ? (
          <div className="space-y-3">
            {set.questions.map((q, i) => (
              <div key={q.id} className="relative group">
                <QuizQuestionCard
                  question={q}
                  index={i}
                  total={set.questions.length}
                  mode="preview"
                  correctIndex={q.answerIndex}
                  explanation={q.explanation}
                />
                <button
                  onClick={() => {
                    setEditingQuestion(q);
                    setEditingIndex(i);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-surface border border-border text-muted hover:text-primary hover:border-primary/40 shadow-xs transition-all"
                  title="Chỉnh sửa câu hỏi này"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {set.questions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-2xl border border-border bg-surface p-4 text-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                      {q.type}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        q.source === "ai_generated"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-muted/10 text-muted",
                      )}
                    >
                      {q.source === "ai_generated" ? "AI sinh" : "Nhập tay"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setEditingIndex(i);
                      }}
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Chỉnh sửa câu hỏi & đáp án"
                    >
                      <PencilLine className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Xoá câu hỏi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="font-medium text-foreground">{q.prompt}</p>
                <ol className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className={cn(
                        "text-sm",
                        oi === q.answerIndex
                          ? "font-semibold text-emerald-700"
                          : "text-muted",
                      )}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                      {oi === q.answerIndex && " ✓"}
                    </li>
                  ))}
                </ol>
                {q.explanation && (
                  <p className="mt-2 text-xs text-muted">Giải thích: {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showManual && (
        <ManualQuestionForm
          setId={setId}
          onClose={() => setShowManual(false)}
          onAdded={load}
        />
      )}
      {showTrial && (
        <AdminTrial setId={setId} onFinished={load} onClose={() => setShowTrial(false)} />
      )}



      {editingQuestion !== null && editingIndex !== null && (
        <EditQuestionModal
          question={editingQuestion}
          questionIndex={editingIndex}
          onClose={() => {
            setEditingQuestion(null);
            setEditingIndex(null);
          }}
          onUpdated={load}
        />
      )}
    </div>
  );
}

function GateItem({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      )}
      <div>
        <p className={cn("font-medium", done ? "text-foreground" : "text-muted")}>
          {label}
        </p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/question-sets"
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Danh sách bộ đề
    </Link>
  );
}
