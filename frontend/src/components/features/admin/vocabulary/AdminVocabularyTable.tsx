"use client";

import * as React from "react";
import { BookOpen, ExternalLink, Eye, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SavedWordItem, SavedWordsResponse } from "@/hooks/useAdminVocabulary";
import { WordDetailModal } from "./WordDetailModal";

interface AdminVocabularyTableProps {
  data: SavedWordsResponse | null;
  loading: boolean;
  onDelete?: (id: number) => Promise<any>;
}

export function AdminVocabularyTable({ data, loading, onDelete }: AdminVocabularyTableProps) {
  const [selectedWord, setSelectedWord] = React.useState<SavedWordItem | null>(null);

  const handleDelete = async (word: SavedWordItem) => {
    if (!onDelete) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa từ "${word.term}" khỏi thư viện hệ thống?`)) {
      try {
        await onDelete(word.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-16 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-xs">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <p className="font-semibold text-foreground">Không có từ vựng nào</p>
        <p className="mt-1 text-sm text-muted">Chưa có người dùng nào lưu từ này hoặc không tìm thấy kết quả phù hợp.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border/80 text-xs font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3.5">Từ vựng</th>
                <th className="px-5 py-3.5">Ngôn ngữ</th>
                <th className="px-5 py-3.5">Khái niệm & Định nghĩa</th>
                <th className="px-5 py-3.5">Người đã lưu</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.items.map((word) => (
                <tr key={word.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-bold text-foreground block text-sm">{word.term}</span>
                    {word.phonetic && <span className="text-xs text-muted font-mono">{word.phonetic}</span>}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {word.language.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-sm">
                    <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
                      {word.definition || "—"}
                    </p>
                    {word.example && (
                      <p className="text-[11px] text-muted italic line-clamp-1 mt-0.5">
                        &quot;{word.example}&quot;
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {word.savedBy.slice(0, 3).map((s, idx) => (
                          <div
                            key={idx}
                            title={s.user.displayName}
                            className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] border border-surface ring-1 ring-border/40 shrink-0"
                          >
                            {s.user.displayName?.charAt(0).toUpperCase() || "U"}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-muted">
                        {word.savedBy.length} người
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedWord(word)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" /> Chi tiết
                      </Button>
                      {onDelete && (
                        <button
                          title="Xóa từ này"
                          onClick={() => handleDelete(word)}
                          className="p-2 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
