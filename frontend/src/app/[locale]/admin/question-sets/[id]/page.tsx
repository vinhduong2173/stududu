"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import {
  formatDateInput,
  parseIsoDate,
  PublishGate,
  QuestionSetDetail,
  TestQuestion,
} from "@/lib/questionSets";
import { EditQuestionModal } from "../_components/EditQuestionModal";
import { AdminTrial } from "../_components/AdminTrial";
import { GeneratePanel } from "../_components/GeneratePanel";
import { ManualQuestionForm } from "../_components/ManualQuestionForm";
import { QuestionSetHeader } from "../_components/QuestionSetHeader";
import { QuestionSetSettingsCard } from "../_components/QuestionSetSettingsCard";
import { PublishGateCard } from "../_components/PublishGateCard";
import { QuestionListSection } from "../_components/QuestionListSection";

export default function AdminQuestionSetEditorPage() {
  const setId = Number(useParams()?.id);
  const [set, setSet] = React.useState<QuestionSetDetail | null>(null);
  const [gate, setGate] = React.useState<PublishGate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);

  const [showManual, setShowManual] = React.useState(false);
  const [showTrial, setShowTrial] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<TestQuestion | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editTimePerQuestionSec, setEditTimePerQuestionSec] = React.useState(15);
  const [editMaxAttempts, setEditMaxAttempts] = React.useState(0);
  const [editStartsAt, setEditStartsAt] = React.useState("");
  const [editEndsAt, setEditEndsAt] = React.useState("");

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
        setEditStartsAt(formatDateInput(s.startsAt));
        setEditEndsAt(formatDateInput(s.endsAt));
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setId]);

  React.useEffect(load, [load]);

  const handleSaveSettings = async () => {
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
          startsAt: parseIsoDate(editStartsAt, false),
          endsAt: parseIsoDate(editEndsAt, true),
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được cấu hình");
    } finally {
      setBusy(false);
    }
  };

  const removeQuestion = async (qId: number) => {
    setBusy(true);
    try {
      await api(`/admin/questions/${qId}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được câu hỏi");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-20 text-center text-sm text-muted">Đang tải…</p>;
  if (!set || !gate) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Link href="/admin/question-sets" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Danh sách bộ đề
        </Link>
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error ?? "Không tìm thấy bộ đề"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <QuestionSetHeader
        set={set}
        gate={gate}
        busy={busy}
        onPublish={async () => {
          setBusy(true);
          try {
            await api(`/admin/question-sets/${setId}/publish`, { method: "POST" });
            load();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Không publish được");
          } finally {
            setBusy(false);
          }
        }}
      />

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <QuestionSetSettingsCard
        editTitle={editTitle} setEditTitle={setEditTitle} editDescription={editDescription} setEditDescription={setEditDescription}
        editTimePerQuestionSec={editTimePerQuestionSec} setEditTimePerQuestionSec={setEditTimePerQuestionSec}
        editMaxAttempts={editMaxAttempts} setEditMaxAttempts={setEditMaxAttempts} editStartsAt={editStartsAt} setEditStartsAt={setEditStartsAt}
        editEndsAt={editEndsAt} setEditEndsAt={setEditEndsAt} saveSuccess={saveSuccess} busy={busy} onSave={handleSaveSettings}
      />

      {set.status !== "published" && <PublishGateCard gate={gate} onOpenTrial={() => setShowTrial(true)} />}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Danh sách câu hỏi (Hiện có {gate.activeCount} câu)</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowManual(true)}>
          <Plus className="mr-2 h-4 w-4" /> Thêm câu thủ công
        </Button>
      </div>

      <GeneratePanel setId={setId} remainingSlots={100} onImported={load} />

      <QuestionListSection
        questions={set.questions} previewMode={previewMode} setPreviewMode={setPreviewMode} busy={busy}
        onEdit={(q, idx) => { setEditingQuestion(q); setEditingIndex(idx); }} onRemove={removeQuestion}
      />

      {showManual && <ManualQuestionForm setId={setId} onClose={() => setShowManual(false)} onAdded={load} />}
      {showTrial && <AdminTrial setId={setId} onFinished={load} onClose={() => setShowTrial(false)} />}
      {editingQuestion !== null && editingIndex !== null && (
        <EditQuestionModal question={editingQuestion} questionIndex={editingIndex} onClose={() => { setEditingQuestion(null); setEditingIndex(null); }} onUpdated={load} />
      )}
    </div>
  );
}
