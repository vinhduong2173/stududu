"use client";

import * as React from "react";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PublishGate, REQUIRED_QUESTION_COUNT } from "@/lib/questionSets";

interface PublishGateCardProps {
  gate: PublishGate;
  onOpenTrial: () => void;
}

export function PublishGateCard({ gate, onOpenTrial }: PublishGateCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Điều kiện xuất bản (Publish Gate)</h2>
          <p className="text-xs text-muted">Bộ đề cần đạt đủ 2 điều kiện dưới đây mới có thể xuất bản cho người học.</p>
        </div>
        {gate.hasEnoughQuestions && (
          <Button variant={gate.hasAdminTrial ? "outline" : "default"} size="sm" onClick={onOpenTrial}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {gate.hasAdminTrial ? "Làm thử lại" : "Làm thử bộ đề ngay"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
        <GateItem
          done={gate.hasEnoughQuestions}
          label={`Đủ ${REQUIRED_QUESTION_COUNT} câu hỏi`}
          detail={`Hiện có ${gate.activeCount}/${REQUIRED_QUESTION_COUNT} câu.`}
        />
        <GateItem
          done={gate.hasAdminTrial}
          label="Admin đã làm thử bộ đề"
          detail={
            gate.hasAdminTrial
              ? `Lần làm gần nhất: ${gate.adminTrial?.correctCount}/${gate.adminTrial?.totalCount} câu đúng.`
              : gate.trialOutdated
              ? "Nội dung câu hỏi đã thay đổi kể từ lần làm thử trước. Vui lòng làm thử lại!"
              : "Cần Admin làm thử 1 lần trước khi phát hành."
          }
        />
      </div>
    </div>
  );
}

function GateItem({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      )}
      <div>
        <p className={cn("font-medium", done ? "text-foreground" : "text-muted")}>{label}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}
