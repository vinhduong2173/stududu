"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/features/TrustDialogs";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/** MÀN 16 — Quản lý danh mục LANGUAGE & TOPIC (US-21): thêm / sửa / ẩn. */

type Language = { id: number; code: string; name: string; framework?: string | null; hidden: boolean };
type Topic = { id: number; name: string; hidden: boolean };

export default function AdminCatalogPage() {
  const { show: showToast, toast } = useToast();

  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Form thêm ngôn ngữ
  const [newLangCode, setNewLangCode] = React.useState("");
  const [newLangName, setNewLangName] = React.useState("");
  // Form thêm topic
  const [newTopicName, setNewTopicName] = React.useState("");

  // Sửa inline
  const [editingLang, setEditingLang] = React.useState<Language | null>(null);
  const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([api<Language[]>("/admin/languages"), api<Topic[]>("/admin/topics")])
      .then(([langs, tps]) => {
        setLanguages(langs);
        setTopics(tps);
      })
      .catch((err) => setError(err.message || "Không tải được danh mục"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const wrap = async (fn: () => Promise<unknown>, successMsg: string) => {
    setError("");
    try {
      await fn();
      showToast(successMsg);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    }
  };

  const addLanguage = () =>
    wrap(async () => {
      if (!newLangCode.trim() || !newLangName.trim()) throw new ApiError(400, "Cần nhập mã và tên ngôn ngữ");
      await api("/admin/languages", {
        method: "POST",
        body: { code: newLangCode.trim().toLowerCase(), name: newLangName.trim() },
      });
      setNewLangCode("");
      setNewLangName("");
    }, "Đã thêm ngôn ngữ");

  const saveLanguage = () =>
    wrap(async () => {
      if (!editingLang) return;
      await api(`/admin/languages/${editingLang.id}`, {
        method: "PATCH",
        body: { code: editingLang.code.trim().toLowerCase(), name: editingLang.name.trim() },
      });
      setEditingLang(null);
    }, "Đã cập nhật ngôn ngữ");

  // US-21 — ẩn/hiện: mục ẩn biến mất khỏi hồ sơ & bộ lọc của member, không xóa dữ liệu
  const toggleLanguageHidden = (l: Language) =>
    wrap(
      () => api(`/admin/languages/${l.id}`, { method: "PATCH", body: { hidden: !l.hidden } }),
      l.hidden ? `Đã hiện lại "${l.name}"` : `Đã ẩn "${l.name}"`,
    );

  const toggleTopicHidden = (t: Topic) =>
    wrap(
      () => api(`/admin/topics/${t.id}`, { method: "PATCH", body: { hidden: !t.hidden } }),
      t.hidden ? `Đã hiện lại "${t.name}"` : `Đã ẩn "${t.name}"`,
    );

  const addTopic = () =>
    wrap(async () => {
      if (!newTopicName.trim()) throw new ApiError(400, "Cần nhập tên chủ đề");
      await api("/admin/topics", { method: "POST", body: { name: newTopicName.trim() } });
      setNewTopicName("");
    }, "Đã thêm chủ đề");

  const saveTopic = () =>
    wrap(async () => {
      if (!editingTopic) return;
      await api(`/admin/topics/${editingTopic.id}`, {
        method: "PATCH",
        body: { name: editingTopic.name.trim() },
      });
      setEditingTopic(null);
    }, "Đã cập nhật chủ đề");

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Quản lý danh mục</h1>
      <p className="text-sm text-muted mb-6">Ngôn ngữ và chủ đề sở thích dùng trong hồ sơ & matching.</p>

      {error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Languages */}
        <section className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Ngôn ngữ ({languages.length})</h2>

          <div className="flex gap-2 mb-4">
            <Input className="w-24" placeholder="Mã (vi)" value={newLangCode} onChange={(e) => setNewLangCode(e.target.value)} />
            <Input placeholder="Tên (Tiếng Việt)" value={newLangName} onChange={(e) => setNewLangName(e.target.value)} />
            <Button variant="secondary" onClick={addLanguage}>Thêm</Button>
          </div>

          <ul className="divide-y divide-border">
            {languages.map((l) => (
              <li key={l.id} className="py-2.5 flex items-center gap-3">
                {editingLang?.id === l.id ? (
                  <>
                    <Input
                      className="w-20 h-9"
                      value={editingLang.code}
                      onChange={(e) => setEditingLang({ ...editingLang, code: e.target.value })}
                    />
                    <Input
                      className="h-9"
                      value={editingLang.name}
                      onChange={(e) => setEditingLang({ ...editingLang, name: e.target.value })}
                    />
                    <Button size="sm" onClick={saveLanguage}>Lưu</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingLang(null)}>Hủy</Button>
                  </>
                ) : (
                  <>
                    <code className="text-xs bg-muted/10 rounded px-2 py-1 text-muted w-14 text-center">{l.code}</code>
                    <span className={cn("flex-1 font-medium", l.hidden ? "text-muted line-through" : "text-foreground")}>
                      {l.name}
                      {l.hidden && (
                        <span className="ml-2 text-[10px] font-bold rounded-full px-2 py-0.5 bg-muted/15 text-muted no-underline inline-block">
                          Đã ẩn
                        </span>
                      )}
                    </span>
                    <button
                      className="p-1.5 hover:bg-muted/10 rounded-lg text-muted"
                      title={l.hidden ? "Hiện lại" : "Ẩn khỏi hồ sơ & bộ lọc"}
                      onClick={() => toggleLanguageHidden(l)}
                    >
                      {l.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button className="p-1.5 hover:bg-muted/10 rounded-lg text-muted" onClick={() => setEditingLang(l)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Topics */}
        <section className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Chủ đề sở thích ({topics.length})</h2>

          <div className="flex gap-2 mb-4">
            <Input placeholder="Tên chủ đề (Du lịch…)" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} />
            <Button variant="secondary" onClick={addTopic}>Thêm</Button>
          </div>

          <ul className="divide-y divide-border">
            {topics.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center gap-3">
                {editingTopic?.id === t.id ? (
                  <>
                    <Input
                      className="h-9"
                      value={editingTopic.name}
                      onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                    />
                    <Button size="sm" onClick={saveTopic}>Lưu</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingTopic(null)}>Hủy</Button>
                  </>
                ) : (
                  <>
                    <span className={cn("flex-1 font-medium", t.hidden ? "text-muted line-through" : "text-foreground")}>
                      {t.name}
                      {t.hidden && (
                        <span className="ml-2 text-[10px] font-bold rounded-full px-2 py-0.5 bg-muted/15 text-muted no-underline inline-block">
                          Đã ẩn
                        </span>
                      )}
                    </span>
                    <button
                      className="p-1.5 hover:bg-muted/10 rounded-lg text-muted"
                      title={t.hidden ? "Hiện lại" : "Ẩn khỏi hồ sơ & bộ lọc"}
                      onClick={() => toggleTopicHidden(t)}
                    >
                      {t.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button className="p-1.5 hover:bg-muted/10 rounded-lg text-muted" onClick={() => setEditingTopic(t)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {toast}
    </div>
  );
}
