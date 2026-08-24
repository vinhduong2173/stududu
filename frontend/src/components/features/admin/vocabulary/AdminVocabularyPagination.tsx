"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SavedWordsResponse } from "@/hooks/useAdminVocabulary";

interface AdminVocabularyPaginationProps {
  data: SavedWordsResponse;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export function AdminVocabularyPagination({ data, page, setPage }: AdminVocabularyPaginationProps) {
  if (data.totalPages <= 1) return null;

  return (
    <div className="p-4 rounded-2xl border border-border/80 flex items-center justify-between bg-surface shadow-xs">
      <span className="text-xs text-muted">
        Trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng <strong>{data.total}</strong> từ vựng)
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="gap-1 text-xs"
        >
          <ChevronLeft className="h-4 w-4" /> Trước
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= data.totalPages}
          onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          className="gap-1 text-xs"
        >
          Sau <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
