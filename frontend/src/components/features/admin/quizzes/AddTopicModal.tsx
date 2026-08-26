import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddTopicModalProps {
  newTopicName: string;
  onChangeName: (val: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export function AddTopicModal({
  newTopicName,
  onChangeName,
  onClose,
  onAdd,
}: AddTopicModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Thêm chủ đề mới</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            Tên chủ đề từ vựng
          </label>
          <Input
            value={newTopicName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="VD: Khoa học vũ trụ, Y tế..."
            className="rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Hủy
          </Button>
          <Button onClick={onAdd} className="rounded-xl bg-primary text-primary-foreground">
            Thêm chủ đề
          </Button>
        </div>
      </div>
    </div>
  );
}
