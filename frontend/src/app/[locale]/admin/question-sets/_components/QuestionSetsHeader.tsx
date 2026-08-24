"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { REQUIRED_QUESTION_COUNT } from "@/lib/questionSets";

interface QuestionSetsHeaderProps {
  loading: boolean;
  canCreate: boolean;
  onOpenCreate: () => void;
}

export function QuestionSetsHeader({
  loading,
  canCreate,
  onOpenCreate,
}: QuestionSetsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bộ đề trắc nghiệm
        </h1>
        <p className="mt-1 text-sm text-muted">
          Mỗi bộ chuẩn {REQUIRED_QUESTION_COUNT} câu. Soạn đề qua AI hoặc thủ công, làm thử đạt chuẩn trước khi phát hành.
        </p>
      </div>

      <Button
        size="sm"
        onClick={onOpenCreate}
        disabled={loading || !canCreate}
        className="gap-2 shrink-0"
      >
        <Plus className="h-4 w-4" /> Tạo bộ đề mới
      </Button>
    </div>
  );
}
