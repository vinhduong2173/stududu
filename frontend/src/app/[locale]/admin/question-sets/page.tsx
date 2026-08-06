"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CEFR_LEVELS,
  FRAMEWORKS,
  LanguageRef,
  QuestionSetSummary,
  REQUIRED_QUESTION_COUNT,
  VocabTopic,
} from "@/lib/questionSets";

// Không export: file page.tsx của App Router chỉ cho phép các named export đã định sẵn
const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  draft: { text: "Bản nháp", className: "bg-amber-50 text-amber-700 border-amber-200" },
  published: { text: "Đã phát hành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { text: "Lưu trữ", className: "bg-muted/10 text-muted border-border" },
};

export default function AdminQuestionSetsPage() {
  const router = useRouter();
  const [sets, setSets] = React.useState<QuestionSetSummary[]>([]);
  const [languages, setLanguages] = React.useState<LanguageRef[]>([]);
  const [topics, setTopics] = React.useState<VocabTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDeleteSet = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá bộ đề "${title}" không? Hành động này không thể hoàn tác.`)) {
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

  // `loading` khởi tạo là true nên không set lại ở đây — set state đồng bộ ngay
  // trong effect sẽ gây cascading render (react-hooks/purity)
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

  // Chủ đề đang ẩn không được tạo bộ đề mới (người học sẽ không thấy bộ đó)
  const availableTopics = topics.filter((t) => !t.hidden);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bộ đề trắc nghiệm</h1>
          <p className="mt-1 text-sm text-muted">
            Mỗi bộ đúng {REQUIRED_QUESTION_COUNT} câu. Chỉ publish được khi đủ câu và
            bạn đã làm thử ít nhất một lần.
          </p>
          <p className="mt-2 text-sm text-muted">
            Luồng: <strong className="text-foreground">1.</strong> Tạo bộ đề (chỉ
            là vỏ, chưa có câu hỏi) →{" "}
            <strong className="text-foreground">2.</strong> Mở bộ đề, tải tài liệu
            lên để AI sinh câu hỏi →{" "}
            <strong className="text-foreground">3.</strong> Làm thử → publish.
          </p>
        </div>
        {/* Modal lấy giá trị mặc định từ languages[0]/topics[0]; mở khi chưa tải xong
            sẽ gửi languageId = 0 và ăn lỗi "Không tìm thấy ngôn ngữ" */}
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          disabled={loading || languages.length === 0 || availableTopics.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" /> Tạo bộ đề
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-muted">Đang tải…</div>
      ) : sets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted/50" />
          <p className="mt-3 font-semibold text-foreground">Chưa có bộ đề nào</p>
          <p className="mt-1 text-sm text-muted">
            Tạo bộ đề rồi tải tài liệu lên để AI sinh câu hỏi nháp.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-muted/5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Bộ đề</th>
                <th className="px-4 py-3">Ngôn ngữ</th>
                <th className="px-4 py-3">Chủ đề</th>
                <th className="px-4 py-3">Trình độ</th>
                <th className="px-4 py-3">Số câu</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Bước tiếp theo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sets.map((set) => {
                const status = STATUS_LABEL[set.status] ?? STATUS_LABEL.draft;
                const active = set._count?.questions ?? set.questionCount;
                return (
                  <tr key={set.id} className="hover:bg-muted/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/question-sets/${set.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {set.title}
                      </Link>
                      {set.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                          {set.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{set.language.name}</td>
                    <td className="px-4 py-3 text-muted">{set.topic.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {set.framework} {set.level}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "font-semibold",
                          active === REQUIRED_QUESTION_COUNT
                            ? "text-emerald-600"
                            : "text-amber-600",
                        )}
                      >
                        {active}/{REQUIRED_QUESTION_COUNT}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          status.className,
                        )}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant={active === 0 ? "default" : "ghost"}>
                          <Link href={`/admin/question-sets/${set.id}`}>
                            {active === 0 ? (
                              <>
                                <Sparkles className="mr-1.5 h-4 w-4" /> Thêm câu hỏi
                              </>
                            ) : (
                              <>
                                Soạn đề <ArrowRight className="ml-1.5 h-4 w-4" />
                              </>
                            )}
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSet(set.id, set.title)}
                          disabled={deletingId === set.id}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 p-2 h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          title="Xoá bộ đề"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateSetModal
          languages={languages}
          topics={availableTopics}
          onClose={() => setCreating(false)}
          // Tạo xong đi thẳng vào màn soạn đề — bộ đề mới chỉ là cái vỏ 0/20 câu,
          // dừng lại ở bảng danh sách khiến người dùng tưởng luồng đã hết
          onCreated={(newSetId) => {
            setCreating(false);
            router.push(`/admin/question-sets/${newSetId}`);
          }}
        />
      )}
    </div>
  );
}

function CreateSetModal({
  languages,
  topics,
  onClose,
  onCreated,
}: {
  languages: LanguageRef[];
  topics: VocabTopic[];
  onClose: () => void;
  onCreated: (newSetId: number) => void;
}) {
  const [form, setForm] = React.useState({
    languageId: languages[0]?.id ?? 0,
    topicId: topics[0]?.id ?? 0,
    framework: "CEFR",
    level: "A1",
    title: "",
    description: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Tạo bộ đề mới</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngôn ngữ">
            <select
              className={INPUT_CLASS}
              value={form.languageId}
              onChange={(e) => setForm({ ...form, languageId: Number(e.target.value) })}
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Chủ đề từ vựng">
            <select
              className={INPUT_CLASS}
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: Number(e.target.value) })}
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Khung trình độ">
            <select
              className={INPUT_CLASS}
              value={form.framework}
              onChange={(e) => setForm({ ...form, framework: e.target.value })}
            >
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trình độ">
            <select
              className={INPUT_CLASS}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Tiêu đề">
          <input
            className={INPUT_CLASS}
            value={form.title}
            placeholder={suggestedTitle() || "Ví dụ: Động vật · B1"}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </Field>

        <Field label="Mô tả (không bắt buộc)">
          <textarea
            className={cn(INPUT_CLASS, "min-h-20")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <p className="text-xs text-muted">
          Mỗi tổ hợp (ngôn ngữ × chủ đề × trình độ) chỉ có một bộ đề.
        </p>

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
            {saving ? "Đang tạo…" : "Tạo bộ đề"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
