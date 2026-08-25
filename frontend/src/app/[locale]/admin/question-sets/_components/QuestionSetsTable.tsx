"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { QuestionSetSummary, REQUIRED_QUESTION_COUNT } from "@/lib/questionSets";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  draft: { text: "Bản nháp", className: "bg-amber-50 text-amber-700 border-amber-200" },
  published: { text: "Đã phát hành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived: { text: "Lưu trữ", className: "bg-muted/15 text-muted border-border" },
};

interface QuestionSetsTableProps {
  sets: QuestionSetSummary[];
  loading: boolean;
  deletingId: number | null;
  onDeleteSet: (id: number, title: string) => void;
}

export function QuestionSetsTable({ sets, loading, deletingId, onDeleteSet }: QuestionSetsTableProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-16 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-xs">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <p className="font-semibold text-foreground">Chưa có bộ đề nào</p>
        <p className="mt-1 text-sm text-muted">Tạo bộ đề rồi tải tài liệu lên để AI sinh câu hỏi nháp.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/20 border-b border-border/80 text-xs font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3.5">Bộ đề</th>
              <th className="px-5 py-3.5">Ngôn ngữ</th>
              <th className="px-5 py-3.5">Chủ đề</th>
              <th className="px-5 py-3.5">Trình độ</th>
              <th className="px-5 py-3.5">Số câu</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sets.map((set) => {
              const status = STATUS_LABEL[set.status] ?? STATUS_LABEL.draft;
              const active = set._count?.questions ?? set.questionCount;
              const isComplete = active === REQUIRED_QUESTION_COUNT;

              return (
                <tr key={set.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/question-sets/${set.id}`} className="font-bold text-foreground hover:text-primary transition-colors block">
                      {set.title}
                    </Link>
                    {set.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{set.description}</p>}
                  </td>
                  <td className="px-5 py-4 text-muted whitespace-nowrap font-medium">{set.language.name}</td>
                  <td className="px-5 py-4 text-muted whitespace-nowrap">{set.topic.name}</td>
                  <td className="px-5 py-4 text-muted whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-muted/15 font-mono text-xs font-semibold text-foreground">
                      {set.framework} {set.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={cn("font-bold text-xs px-2.5 py-1 rounded-full border", isComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                      {active}/{REQUIRED_QUESTION_COUNT} câu
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold inline-block", status.className)}>
                      {status.text}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant={active === 0 ? "default" : "outline"} className="gap-1 text-xs font-semibold">
                        <Link href={`/admin/question-sets/${set.id}`}>
                          {active === 0 ? <><Sparkles className="h-3.5 w-3.5" /> Thêm câu</> : <>Soạn đề <ArrowRight className="h-3.5 w-3.5" /></>}
                        </Link>
                      </Button>
                      <button onClick={() => onDeleteSet(set.id, set.title)} disabled={deletingId === set.id} className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50" title="Xoá bộ đề">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
