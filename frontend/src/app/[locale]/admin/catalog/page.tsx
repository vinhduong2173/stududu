"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/features/TrustDialogs";
import { Language, LanguageCatalogCard } from "@/components/features/admin/catalog/LanguageCatalogCard";
import { Topic, TopicCatalogCard } from "@/components/features/admin/catalog/TopicCatalogCard";

export default function AdminCatalogPage() {
  const { show: showToast, toast } = useToast();
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

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

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-6 md:p-8">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Quản lý danh mục</h1>
      <p className="mb-6 text-sm text-muted">Ngôn ngữ và chủ đề sở thích dùng trong hồ sơ & matching.</p>
      {error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <LanguageCatalogCard
          languages={languages}
          onAdd={(code, name) => wrap(() => api("/admin/languages", { method: "POST", body: { code, name } }), "Đã thêm ngôn ngữ")}
          onSave={(l) => wrap(() => api(`/admin/languages/${l.id}`, { method: "PATCH", body: { code: l.code, name: l.name } }), "Đã cập nhật")}
          onToggleHidden={(l) => wrap(() => api(`/admin/languages/${l.id}`, { method: "PATCH", body: { hidden: !l.hidden } }), l.hidden ? `Đã hiện lại "${l.name}"` : `Đã ẩn "${l.name}"`)}
          onDelete={(l) => wrap(() => api(`/admin/languages/${l.id}`, { method: "DELETE" }), `Đã xóa ngôn ngữ "${l.name}"`)}
        />
        <TopicCatalogCard
          topics={topics}
          onAdd={(name) => wrap(() => api("/admin/topics", { method: "POST", body: { name } }), "Đã thêm chủ đề")}
          onSave={(t) => wrap(() => api(`/admin/topics/${t.id}`, { method: "PATCH", body: { name: t.name } }), "Đã cập nhật")}
          onToggleHidden={(t) => wrap(() => api(`/admin/topics/${t.id}`, { method: "PATCH", body: { hidden: !t.hidden } }), t.hidden ? `Đã hiện lại "${t.name}"` : `Đã ẩn "${t.name}"`)}
          onDelete={(t) => wrap(() => api(`/admin/topics/${t.id}`, { method: "DELETE" }), `Đã xóa chủ đề "${t.name}"`)}
        />
      </div>
      {toast}
    </div>
  );
}
