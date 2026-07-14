"use client";

import * as React from "react";
import { BookOpen, Globe2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { WordSaveModal, type SavedWord } from "@/components/features/WordSaveModal";
import { useToast } from "@/components/features/TrustDialogs";
import { cn } from "@/lib/utils";

/** FS-23/24 — Sổ từ của tôi + Thư viện từ chung (public khi ≥3 người lưu — BR-12). */

type LibraryWord = {
  id: number;
  term: string;
  definition?: string | null;
  example?: string | null;
  saveCount: number;
  language: { id: number; name: string };
};

type Tab = "mine" | "library";

export default function VocabularyPage() {
  const [tab, setTab] = React.useState<Tab>("mine");
  const { show: showToast, toast } = useToast();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 pb-24">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-5">
        <BookOpen className="w-6 h-6 text-primary" /> Từ vựng
      </h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("mine")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
            tab === "mine"
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          📒 Sổ của tôi
        </button>
        <button
          onClick={() => setTab("library")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
            tab === "library"
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          <Globe2 className="w-4 h-4" /> Thư viện chung
        </button>
      </div>

      {tab === "mine" ? <MyWordsTab showToast={showToast} /> : <LibraryTab showToast={showToast} />}
      {toast}
    </div>
  );
}

// ================= Sổ của tôi (FS-23) =================
function MyWordsTab({ showToast }: { showToast: (msg: string) => void }) {
  const [words, setWords] = React.useState<SavedWord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  React.useEffect(() => {
    api<SavedWord[]>("/vocabulary/my-words")
      .then(setWords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = words.filter(
    (w) =>
      !search ||
      w.word.term.toLowerCase().includes(search.toLowerCase()) ||
      (w.personalNote ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    try {
      await api(`/vocabulary/my-words/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm từ, ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-full border-2 border-border bg-surface pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Thêm từ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/10 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
              <button
                className="w-full text-left p-4 hover:bg-muted/5 transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-base">{item.word.term}</span>
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                        {item.word.language.name}
                      </span>
                      {item.word.level && (
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-warning/10 text-warning border border-warning/20">
                          ⭐ Level {item.word.level}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-bold rounded-full px-2 py-0.5",
                          item.source === "chat" ? "bg-secondary/10 text-secondary" : "bg-muted/15 text-muted",
                        )}
                      >
                        {item.source === "chat" ? "💬 Từ chat" : "✍️ Thêm tay"}
                      </span>
                      {item.word.isPublic && (
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-success/10 text-success">
                          🌐 Trong thư viện chung
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-1 truncate">
                      {item.word.definition || item.personalNote || "Chưa có định nghĩa/ghi chú"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(item.id);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-error/10 flex items-center justify-center text-muted hover:text-error transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </button>

               {expandedId === item.id && (
                <div className="border-t border-border bg-muted/5 px-4 py-3 space-y-1.5 text-sm">
                  {item.word.level && (
                    <p><span className="text-muted font-medium">Trình độ:</span> {item.word.level}</p>
                  )}
                  {item.word.definition && (
                    <p><span className="text-muted font-medium">Định nghĩa:</span> {item.word.definition}</p>
                  )}
                  {item.word.example && (
                    <p><span className="text-muted font-medium">Ví dụ:</span> {item.word.example}</p>
                  )}
                  {item.personalNote && (
                    <p><span className="text-muted font-medium">Ghi chú riêng:</span> {item.personalNote}</p>
                  )}
                  <p className="text-xs text-muted">
                    {item.word.saveCount} người đã lưu từ này
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📒</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {search ? "Không tìm thấy từ nào" : "Sổ từ vựng trống"}
          </h3>
          <p className="text-muted text-sm mb-6 max-w-xs leading-relaxed">
            {search ? "Thử tìm với từ khóa khác." : "Bôi đen từ trong khi chat hoặc thêm tay để xây vốn từ."}
          </p>
          {!search && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Thêm từ đầu tiên
            </Button>
          )}
        </div>
      )}

      <WordSaveModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        source="manual"
        onSaved={(item, duplicated) => {
          setWords((prev) => [item, ...prev.filter((w) => w.id !== item.id)]);
          showToast(duplicated ? `"${item.word.term}" đã có trong sổ — cập nhật ghi chú` : `✅ Đã lưu "${item.word.term}"`);
        }}
      />
    </>
  );
}

// ================= Thư viện chung (FS-24) =================
function LibraryTab({ showToast }: { showToast: (msg: string) => void }) {
  const [words, setWords] = React.useState<LibraryWord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<LibraryWord | null>(null);
  const [defDraft, setDefDraft] = React.useState("");
  const [exampleDraft, setExampleDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback((q?: string) => {
    setLoading(true);
    api<LibraryWord[]>(`/vocabulary/library${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setWords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(search.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleContribute = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await api<LibraryWord>(`/vocabulary/library/${editing.id}`, {
        method: "PATCH",
        body: {
          definition: defDraft.trim() || undefined,
          example: exampleDraft.trim() || undefined,
        },
      });
      setWords((prev) => prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)));
      setEditing(null);
      showToast("🙌 Cảm ơn bạn đã đóng góp cho thư viện!");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm trong thư viện chung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 rounded-full border-2 border-border bg-surface pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
        />
      </div>

      <p className="text-xs text-muted mb-4">
        🌐 Từ được ≥3 thành viên cùng lưu sẽ tự vào thư viện chung — xếp theo lượt lưu.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted/10 animate-pulse" />
          ))}
        </div>
      ) : words.length > 0 ? (
        <div className="space-y-3">
          {words.map((w) => (
            <div key={w.id} className="bg-surface rounded-2xl border border-border shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-base">{w.term}</span>
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                      {w.language.name}
                    </span>
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-success/10 text-success">
                      {w.saveCount} lượt lưu
                    </span>
                  </div>
                  {w.definition ? (
                    <p className="text-sm text-foreground mt-1">{w.definition}</p>
                  ) : (
                    <p className="text-sm text-warning mt-1">⏳ Cần bổ sung định nghĩa</p>
                  )}
                  {w.example && <p className="text-xs text-muted mt-0.5 italic">VD: {w.example}</p>}
                </div>
                <button
                  className="p-1.5 hover:bg-muted/10 rounded-lg text-muted shrink-0"
                  title="Bổ sung định nghĩa / ví dụ"
                  onClick={() => {
                    setEditing(w);
                    setDefDraft(w.definition ?? "");
                    setExampleDraft(w.example ?? "");
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-3">🌐</div>
          <p className="font-semibold text-foreground">Thư viện đang chờ đóng góp</p>
          <p className="text-sm text-muted mt-1 max-w-xs">
            {search ? "Không tìm thấy từ nào khớp." : "Khi một từ được ≥3 người lưu, nó sẽ xuất hiện ở đây."}
          </p>
        </div>
      )}

      {/* Modal bổ sung định nghĩa (FS-24) */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-5 space-y-4">
            <h2 className="font-bold text-foreground">
              Bổ sung cho &quot;{editing.term}&quot;
            </h2>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">Định nghĩa</label>
              <textarea
                value={defDraft}
                onChange={(e) => setDefDraft(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-transparent p-3 text-sm focus:outline-none focus:border-primary resize-none h-20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">Ví dụ</label>
              <textarea
                value={exampleDraft}
                onChange={(e) => setExampleDraft(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-transparent p-3 text-sm focus:outline-none focus:border-primary resize-none h-16"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setEditing(null)} disabled={saving}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={handleContribute} disabled={saving}>
                {saving ? "Đang lưu..." : "Đóng góp"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
