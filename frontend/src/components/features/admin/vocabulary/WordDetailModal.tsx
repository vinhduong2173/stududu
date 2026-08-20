"use client";

import * as React from "react";
import { BookOpen, Calendar, MessageSquare, Trash2, User, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SavedWordItem } from "@/hooks/useAdminVocabulary";

interface WordDetailModalProps {
  word: SavedWordItem;
  onClose: () => void;
  onDelete?: (id: number) => Promise<any>;
}

export function WordDetailModal({ word, onClose, onDelete }: WordDetailModalProps) {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa từ "${word.term}" khỏi thư viện hệ thống?`)) {
      setDeleting(true);
      try {
        await onDelete(word.id);
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-5 bg-surface-2/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{word.term}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  {word.language.name}
                </span>
              </div>
              {word.phonetic && <p className="text-xs text-muted font-mono mt-0.5">{word.phonetic}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Definition & Example */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Khái niệm & Định nghĩa</span>
            <p className="text-sm text-foreground font-medium">{word.definition || "Chưa có định nghĩa chi tiết."}</p>
            {word.example && (
              <p className="text-xs text-muted italic border-t border-border/40 pt-2 mt-2">
                Ví dụ: &quot;{word.example}&quot;
              </p>
            )}
          </div>

          {/* Savers List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Danh sách người đã lưu ({word.savedBy.length})
              </span>
            </div>

            {word.savedBy.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">Chưa có thông tin người lưu.</p>
            ) : (
              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto border border-border/60 rounded-xl bg-surface">
                {word.savedBy.map((s, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-[11px]">
                        {s.user.displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{s.user.displayName}</p>
                        <p className="text-muted text-[11px] truncate">{s.user.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 flex items-center justify-between bg-surface">
          {onDelete ? (
            <Button
              size="sm"
              variant="outline"
              disabled={deleting}
              onClick={handleDelete}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5 font-semibold text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa từ này
            </Button>
          ) : <div />}
          <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
