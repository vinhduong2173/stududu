"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  FRAMEWORKS,
  FrameworkType,
  getDefaultFrameworkForLanguage,
  getLevelsForFramework,
  LanguageRef,
  VocabTopic,
} from "@/lib/questionSets";

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

interface CreateSetModalProps {
  languages: LanguageRef[];
  topics: VocabTopic[];
  onClose: () => void;
  onCreated: (newSetId: number) => void;
}

export function CreateSetModal({ languages, topics, onClose, onCreated }: CreateSetModalProps) {
  const initialLang = languages[0];
  const initialConfig = getDefaultFrameworkForLanguage(initialLang?.code || initialLang?.name);

  const [form, setForm] = React.useState({
    languageId: initialLang?.id ?? 0,
    topicId: topics[0]?.id ?? 0,
    framework: initialConfig.framework as string,
    level: initialConfig.defaultLevel,
    title: "",
    description: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLanguageChange = (newLangId: number) => {
    const selected = languages.find((l) => l.id === newLangId);
    const config = getDefaultFrameworkForLanguage(selected?.code || selected?.name);
    setForm((prev) => ({
      ...prev,
      languageId: newLangId,
      framework: config.framework,
      level: config.defaultLevel,
    }));
  };

  const handleFrameworkChange = (newFramework: string) => {
    const availableLevels = getLevelsForFramework(newFramework);
    setForm((prev) => ({
      ...prev,
      framework: newFramework,
      level: availableLevels.includes(prev.level) ? prev.level : availableLevels[0] || "A1",
    }));
  };

  const currentLevels = getLevelsForFramework(form.framework);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api<{ id: number }>("/admin/question-sets", {
        method: "POST",
        body: form,
      });
      onCreated(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được bộ đề");
    } finally {
      setSaving(false);
    }
  };

  const suggestedTitle = () => {
    const topic = topics.find((t) => t.id === form.topicId);
    return topic ? `${topic.name} · ${form.level}` : "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Tạo bộ đề mới</h2>
            <p className="text-xs text-muted mt-0.5">Khởi tạo vỏ đề trắc nghiệm trước khi soạn câu hỏi</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Ngôn ngữ</span>
            <select className={INPUT_CLASS} value={form.languageId} onChange={(e) => handleLanguageChange(Number(e.target.value))}>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Chủ đề từ vựng</span>
            <select className={INPUT_CLASS} value={form.topicId} onChange={(e) => setForm({ ...form, topicId: Number(e.target.value) })}>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Khung trình độ</span>
            <select className={INPUT_CLASS} value={form.framework} onChange={(e) => handleFrameworkChange(e.target.value)}>
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Trình độ</span>
            <select className={INPUT_CLASS} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {currentLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Tiêu đề</span>
          <input className={INPUT_CLASS} value={form.title} placeholder={suggestedTitle() || `Ví dụ: Động vật · ${form.level}`} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Mô tả (không bắt buộc)</span>
          <textarea className={cn(INPUT_CLASS, "min-h-20 resize-none")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <p className="text-xs text-muted bg-muted/10 p-2.5 rounded-xl border border-border/40">
          💡 Mỗi tổ hợp ({form.framework} {form.level} × chủ đề) chỉ nên có một bộ đề trắc nghiệm chuẩn.
        </p>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Huỷ</Button>
          <Button type="submit" size="sm" disabled={saving}>{saving ? "Đang tạo…" : "Tạo bộ đề"}</Button>
        </div>
      </form>
    </div>
  );
}
