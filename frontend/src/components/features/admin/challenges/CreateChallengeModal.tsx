"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { QuestionSetSummary } from "@/lib/questionSets";

const INPUT =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

interface CreateChallengeModalProps {
  sets: QuestionSetSummary[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateChallengeModal({ sets, onClose, onCreated }: CreateChallengeModalProps) {
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
    if (new Date(form.startsAt) >= new Date(form.endsAt)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api("/admin/challenges", {
        method: "POST",
        body: {
          ...form,
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
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Tạo thử thách</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Bộ đề</span>
          <select className={INPUT} value={form.setId} onChange={(e) => setForm({ ...form, setId: Number(e.target.value) })}>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.framework} {s.level})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Tên thử thách</span>
          <input className={INPUT} value={form.title} placeholder="Ví dụ: Thử thách từ vựng tuần này" onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Mô tả (không bắt buộc)</span>
          <textarea className={`${INPUT} min-h-20`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Bắt đầu</span>
            <input type="datetime-local" className={INPUT} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Kết thúc</span>
            <input type="datetime-local" className={INPUT} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
          </label>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Huỷ</Button>
          <Button type="submit" size="sm" disabled={saving}>{saving ? "Đang tạo…" : "Tạo thử thách"}</Button>
        </div>
      </form>
    </div>
  );
}
