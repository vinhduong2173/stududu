"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  LanguageRef,
  QuestionSetSummary,
  VocabTopic,
} from "@/lib/questionSets";
import { QuestionSetsHeader } from "./_components/QuestionSetsHeader";
import { QuestionSetsTable } from "./_components/QuestionSetsTable";
import { CreateSetModal } from "./_components/CreateSetModal";

export default function AdminQuestionSetsPage() {
  const router = useRouter();
  const [sets, setSets] = React.useState<QuestionSetSummary[]>([]);
  const [languages, setLanguages] = React.useState<LanguageRef[]>([]);
  const [topics, setTopics] = React.useState<VocabTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const load = React.useCallback(() => {
    Promise.all([
      api<QuestionSetSummary[]>("/admin/question-sets"),
      api<LanguageRef[]>("/admin/languages"),
      api<VocabTopic[]>("/admin/vocab-topics"),
    ])
      .then(([s, l, t]) => {
        setSets(s);
        setLanguages(l);
        setTopics(t);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const handleDeleteSet = async (id: number, title: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xoá bộ đề "${title}" không? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await api(`/admin/question-sets/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được bộ đề");
    } finally {
      setDeletingId(null);
    }
  };

  const availableTopics = topics.filter((t) => !t.hidden);
  const canCreate = languages.length > 0 && availableTopics.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <QuestionSetsHeader
        loading={loading}
        canCreate={canCreate}
        onOpenCreate={() => setCreating(true)}
      />


      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <QuestionSetsTable
        sets={sets}
        loading={loading}
        deletingId={deletingId}
        onDeleteSet={handleDeleteSet}
      />

      {creating && (
        <CreateSetModal
          languages={languages}
          topics={availableTopics}
          onClose={() => setCreating(false)}
          onCreated={(newSetId) => {
            setCreating(false);
            router.push(`/admin/question-sets/${newSetId}`);
          }}
        />
      )}
    </div>
  );
}
