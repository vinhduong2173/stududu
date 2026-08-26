import * as React from "react";
import { BookOpen, CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { QuizSetItem } from "@/hooks/useQuizzesList";

interface QuizzesTableProps {
  sets: QuizSetItem[];
  loading: boolean;
  deletingId: string | null;
  onDelete: (id: string, title: string) => void;
}

export function QuizzesTable({
  sets,
  loading,
  deletingId,
  onDelete,
}: QuizzesTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-border bg-muted/10 text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-6 py-4">Tên bộ đề</th>
              <th className="px-6 py-4">Ngôn ngữ</th>
              <th className="px-6 py-4">Trình độ</th>
              <th className="px-6 py-4">Số từ / Quiz</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  Không tìm thấy bộ đề nào. Bấm &quot;Tạo bộ đề mới&quot; để bắt đầu.
                </td>
              </tr>
            ) : (
              sets.map((qs) => (
                <tr key={qs.id} className="transition-colors hover:bg-muted/5">
                  <td className="px-6 py-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-primary/10 p-2 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{qs.title}</p>
                        <p className="text-xs text-muted">Chủ đề: {qs.topic}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{qs.language}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-muted/20 px-2.5 py-1 text-xs font-bold text-muted">
                      {qs.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-indigo-600">
                    {qs.wordCount} từ
                  </td>
                  <td className="px-6 py-4">
                    {qs.status === "published" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        Bản nháp
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/quizzes/${qs.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/10 hover:text-primary"
                        title="Chỉnh sửa bộ đề"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                      </Link>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(qs.id, qs.title)}
                        disabled={deletingId === qs.id}
                        className="rounded-lg border border-rose-200/60 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        title="Xóa bộ đề"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
