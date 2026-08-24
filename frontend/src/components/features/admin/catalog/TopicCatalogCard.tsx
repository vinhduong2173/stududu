import * as React from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type Topic = { id: number; name: string; hidden: boolean };

interface TopicCatalogCardProps {
  topics: Topic[];
  onAdd: (name: string) => Promise<void>;
  onSave: (topic: Topic) => Promise<void>;
  onToggleHidden: (topic: Topic) => Promise<void>;
  onDelete?: (topic: Topic) => Promise<void>;
}

export function TopicCatalogCard({ topics, onAdd, onSave, onToggleHidden, onDelete }: TopicCatalogCardProps) {
  const [newTopicName, setNewTopicName] = React.useState("");
  const [editing, setEditing] = React.useState<Topic | null>(null);

  const handleAdd = async () => {
    if (!newTopicName.trim()) return;
    await onAdd(newTopicName.trim());
    setNewTopicName("");
  };

  const handleSave = async () => {
    if (!editing) return;
    await onSave(editing);
    setEditing(null);
  };

  const handleDelete = async (t: Topic) => {
    if (!onDelete) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn chủ đề "${t.name}"?`)) {
      await onDelete(t);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-foreground">Chủ đề sở thích ({topics.length})</h2>

      <div className="mb-4 flex gap-2">
        <Input placeholder="Tên chủ đề (Du lịch…)" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} />
        <Button variant="secondary" onClick={handleAdd}>Thêm</Button>
      </div>

      <ul className="divide-y divide-border">
        {topics.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            {editing?.id === t.id ? (
              <>
                <Input className="h-9" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <Button size="sm" onClick={handleSave}>Lưu</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
              </>
            ) : (
              <>
                <span className={cn("flex-1 font-medium", t.hidden ? "text-muted line-through" : "text-foreground")}>
                  {t.name}
                  {t.hidden && <span className="ml-2 inline-block rounded-full bg-muted/15 px-2 py-0.5 text-[10px] font-bold text-muted no-underline">Đã ẩn</span>}
                </span>
                <button className="rounded-lg p-1.5 text-muted hover:bg-muted/10" title={t.hidden ? "Hiện lại" : "Ẩn"} onClick={() => onToggleHidden(t)}>
                  {t.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button className="rounded-lg p-1.5 text-muted hover:bg-muted/10" title="Sửa" onClick={() => setEditing(t)}>
                  <Pencil className="h-4 w-4" />
                </button>
                {onDelete && (
                  <button
                    className="rounded-lg p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa"
                    onClick={() => handleDelete(t)}
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
