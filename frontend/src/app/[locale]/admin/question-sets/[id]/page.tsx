"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import {
  PublishGate,
  QuestionSetDetail,
  REQUIRED_QUESTION_COUNT,
} from "@/lib/questionSets";
import { AdminTrial } from "../_components/AdminTrial";
import { GeneratePanel } from "../_components/GeneratePanel";
import { ManualQuestionForm } from "../_components/ManualQuestionForm";

export default function AdminQuestionSetEditorPage() {
  const params = useParams();
  const setId = Number(params?.id);

  const [set, setSet] = React.useState<QuestionSetDetail | null>(null);
  const [gate, setGate] = React.useState<PublishGate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showManual, setShowManual] = React.useState(false);
  const [showTrial, setShowTrial] = React.useState(false);
  // Chế độ soạn (bảng dữ liệu thô) vs xem trước (đúng giao diện học viên)
  const [previewMode, setPreviewMode] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    if (!Number.isFinite(setId)) return;
    Promise.all([
      api<QuestionSetDetail>(`/admin/question-sets/${setId}`),
      api<PublishGate>(`/admin/question-sets/${setId}/publish-gate`),
    ])
      .then(([s, g]) => {
        setSet(s);
        setGate(g);
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
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => act(`/admin/question-sets/${setId}/unpublish`, "gỡ phát hành")}
            >
              <Undo2 className="mr-2 h-4 w-4" /> Gỡ phát hành
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={busy || !gate.canPublish}
              onClick={() => act(`/admin/question-sets/${setId}/publish`, "publish")}
            >
              <Send className="mr-2 h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Cửa publish — hai điều kiện, tính lại mỗi lần đọc */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 font-bold text-foreground">Điều kiện phát hành</h2>
        <div className="space-y-2 text-sm">
          <GateItem
            done={gate.hasEnoughQuestions}
            label={`Đủ đúng ${REQUIRED_QUESTION_COUNT} câu đang dùng`}
            detail={`Hiện có ${gate.activeCount}/${REQUIRED_QUESTION_COUNT}`}
          />
          <GateItem
            done={gate.hasAdminTrial}
            label="Admin đã làm thử trọn bộ câu hiện tại"
            detail={
              gate.adminTrial
                ? `Lần gần nhất: ${gate.adminTrial.correctCount}/${gate.adminTrial.totalCount}`
                : gate.trialOutdated
                  ? "Bộ đề đã đổi câu sau lần làm thử trước — cần làm thử lại"
                  : "Chưa làm thử lần nào"
            }
          />
        </div>
        {!gate.hasAdminTrial && gate.hasEnoughQuestions && (
          <Button size="sm" className="mt-4" onClick={() => setShowTrial(true)}>
            <PlayCircle className="mr-2 h-4 w-4" /> Làm thử ngay
          </Button>
        )}
        {gate.hasAdminTrial && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-4"
            onClick={() => setShowTrial(true)}
          >
            <PlayCircle className="mr-2 h-4 w-4" /> Làm thử lại
          </Button>
        )}
      </div>

      {/* Bước 2: chọn cách thêm câu hỏi */}
      {remainingSlots > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">
              Thêm câu hỏi — còn {remainingSlots} chỗ
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowManual(true)}>
              <Plus className="mr-2 h-4 w-4" /> Thêm câu thủ công
            </Button>
          </div>
          <GeneratePanel
            setId={setId}
            remainingSlots={remainingSlots}
            onImported={load}
          />
        </>
      )}

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
              <QuizQuestionCard
                key={q.id}
                question={q}
                index={i}
                total={set.questions.length}
                mode="preview"
                correctIndex={q.answerIndex}
                explanation={q.explanation}
              />
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
                  <button
                    onClick={() => removeQuestion(q.id)}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                    title="Xoá câu hỏi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
