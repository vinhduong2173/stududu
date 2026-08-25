"use client";

import * as React from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type Language = { id: number; code: string; name: string; framework?: string | null; hidden: boolean };

interface LanguageCatalogCardProps {
  languages: Language[];
  onAdd: (code: string, name: string) => Promise<void>;
  onSave: (lang: Language) => Promise<void>;
  onToggleHidden: (lang: Language) => Promise<void>;
  onDelete?: (lang: Language) => Promise<void>;
}

export function LanguageCatalogCard({ languages, onAdd, onSave, onToggleHidden, onDelete }: LanguageCatalogCardProps) {
  const [newCode, setNewCode] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [editing, setEditing] = React.useState<Language | null>(null);

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    await onAdd(newCode.trim().toLowerCase(), newName.trim());
    setNewCode("");
    setNewName("");
  };

  const handleSave = async () => {
    if (!editing) return;
    await onSave(editing);
    setEditing(null);
  };

  const handleDelete = async (l: Language) => {
    if (!onDelete) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ngôn ngữ "${l.name}" (${l.code})? Hành động này sẽ xóa dữ liệu liên quan.`)) {
      await onDelete(l);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-foreground">Ngôn ngữ ({languages.length})</h2>

      <div className="mb-4 flex gap-2">
        <Input className="w-24" placeholder="Mã (vi)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
        <Input placeholder="Tên (Tiếng Việt)" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button variant="secondary" onClick={handleAdd}>Thêm</Button>
      </div>

      <ul className="divide-y divide-border">
        {languages.map((l) => (
          <li key={l.id} className="flex items-center gap-3 py-2.5">
            {editing?.id === l.id ? (
              <>
                <Input className="h-9 w-20" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
                <Input className="h-9" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <Button size="sm" onClick={handleSave}>Lưu</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
              </>
            ) : (
              <>
                <code className="w-14 rounded bg-muted/10 px-2 py-1 text-center text-xs text-muted">{l.code}</code>
                <span className={cn("flex-1 font-medium", l.hidden ? "text-muted line-through" : "text-foreground")}>
                  {l.name}
                  {l.hidden && <span className="ml-2 inline-block rounded-full bg-muted/15 px-2 py-0.5 text-[10px] font-bold text-muted no-underline">Đã ẩn</span>}
                </span>
                <button className="rounded-lg p-1.5 text-muted hover:bg-muted/10" title={l.hidden ? "Hiện lại" : "Ẩn"} onClick={() => onToggleHidden(l)}>
                  {l.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button className="rounded-lg p-1.5 text-muted hover:bg-muted/10" title="Sửa" onClick={() => setEditing(l)}>
                  <Pencil className="h-4 w-4" />
                </button>
                {onDelete && (
                  <button
                    className="rounded-lg p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa"
                    onClick={() => handleDelete(l)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
