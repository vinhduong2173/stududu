"use client";

import * as React from "react";
import { Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { Challenge, QuestionSetSummary } from "@/lib/questionSets";
import { AdminChallengeCard } from "@/components/features/admin/challenges/AdminChallengeCard";
import { CreateChallengeModal } from "@/components/features/admin/challenges/CreateChallengeModal";

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [publishedSets, setPublishedSets] = React.useState<QuestionSetSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    Promise.all([api<Challenge[]>("/challenges"), api<QuestionSetSummary[]>("/admin/question-sets?status=published")])
      .then(([c, s]) => {
        setChallenges(c);
        setPublishedSets(s);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const remove = async (id: number) => {
    try {
      await api(`/admin/challenges/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được thử thách");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thử thách cộng đồng</h1>
          <p className="mt-1 text-sm text-muted">
            Mở một bộ đề đã publish thành thử thách có thời hạn. Bảng xếp hạng tồn tại trong phạm vi thử thách.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} disabled={publishedSets.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Tạo thử thách
        </Button>
      </div>

      {publishedSets.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Chưa có bộ đề nào ở trạng thái <strong>đã phát hành</strong> — publish một bộ trước rồi mới tạo thử thách được.
        </div>
      )}

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Đang tải…</p>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted/50" />
          <p className="mt-3 font-semibold text-foreground">Chưa có thử thách nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <AdminChallengeCard key={c.id} challenge={c} onRemove={remove} />
          ))}
        </div>
      )}

      {creating && <CreateChallengeModal sets={publishedSets} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}
