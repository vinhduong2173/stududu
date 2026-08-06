"use client";

import * as React from "react";
import { Plus, Trash2, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Challenge, QuestionSetSummary } from "@/lib/questionSets";

const INPUT =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

const PHASE_LABEL: Record<Challenge["phase"], { text: string; className: string }> = {
  upcoming: { text: "Sắp diễn ra", className: "bg-sky-50 text-sky-700 border-sky-200" },
  running: { text: "Đang diễn ra", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ended: { text: "Đã kết thúc", className: "bg-muted/10 text-muted border-border" },
};

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [publishedSets, setPublishedSets] = React.useState<QuestionSetSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    Promise.all([
      api<Challenge[]>("/challenges"),
      api<QuestionSetSummary[]>("/admin/question-sets?status=published"),
    ])
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
            Mở một bộ đề đã publish thành thử thách có thời hạn. Mỗi người chỉ được
            làm một lần; bảng xếp hạng chỉ tồn tại trong phạm vi thử thách.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} disabled={publishedSets.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Tạo thử thách
        </Button>
      </div>

      {publishedSets.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Chưa có bộ đề nào ở trạng thái <strong>đã phát hành</strong> — publish một bộ
          trước rồi mới tạo thử thách được.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Đang tải…</p>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted/50" />
          <p className="mt-3 font-semibold text-foreground">Chưa có thử thách nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => {
            const phase = PHASE_LABEL[c.phase];
            return (
              <div
                key={c.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{c.title}</h3>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold",
                        phase.className,
                      )}
                    >
                      {phase.text}
                    </span>
                  </div>
                  {c.description && (
                    <p className="mt-1 text-sm text-muted">{c.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    Bộ đề: {c.set.title} ({c.set.framework} {c.set.level}) ·{" "}
                    {c.participantCount} người tham gia
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(c.startsAt).toLocaleString("vi-VN")} →{" "}
                    {new Date(c.endsAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => remove(c.id)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                  title="Xoá thử thách"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <CreateChallengeModal
          sets={publishedSets}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateChallengeModal({
  sets,
  onClose,
  onCreated,
}: {
  sets: QuestionSetSummary[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const [form, setForm] = React.useState({
    setId: sets[0]?.id ?? 0,
    title: "",
    description: "",
    startsAt: toLocalInput(now),
    endsAt: toLocalInput(weekLater),
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/admin/challenges", {
        method: "POST",
        body: {
          ...form,
          // Gửi UTC lên server, hiển thị lại theo giờ trình duyệt
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được thử thách");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Tạo thử thách</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Bộ đề</span>
          <select
            className={INPUT}
            value={form.setId}
            onChange={(e) => setForm({ ...form, setId: Number(e.target.value) })}
          >
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.framework} {s.level})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Tên thử thách</span>
          <input
            className={INPUT}
            value={form.title}
            placeholder="Ví dụ: Thử thách từ vựng tuần này"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">
            Mô tả (không bắt buộc)
          </span>
          <textarea
            className={cn(INPUT, "min-h-20")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Bắt đầu</span>
            <input
              type="datetime-local"
              className={INPUT}
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Kết thúc</span>
            <input
              type="datetime-local"
              className={INPUT}
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              required
            />
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Đang tạo…" : "Tạo thử thách"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Date -> chuỗi hợp lệ cho <input type="datetime-local"> theo giờ địa phương */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
