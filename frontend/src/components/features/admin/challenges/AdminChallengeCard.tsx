"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Challenge } from "@/lib/questionSets";

const PHASE_LABEL: Record<Challenge["phase"], { text: string; className: string }> = {
  upcoming: { text: "Sắp diễn ra", className: "bg-sky-50 text-sky-700 border-sky-200" },
  running: { text: "Đang diễn ra", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ended: { text: "Đã kết thúc", className: "bg-muted/10 text-muted border-border" },
};

export function AdminChallengeCard({ challenge, onRemove }: { challenge: Challenge; onRemove: (id: number) => void }) {
  const phase = PHASE_LABEL[challenge.phase] ?? PHASE_LABEL.upcoming;

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground">{challenge.title}</h3>
          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", phase.className)}>
            {phase.text}
          </span>
        </div>
        {challenge.description && <p className="mt-1 text-sm text-muted">{challenge.description}</p>}
        <p className="mt-2 text-xs text-muted">
          Bộ đề: {challenge.set.title} ({challenge.set.framework} {challenge.set.level}) · {challenge.participantCount} người tham gia
        </p>
        <p className="text-xs text-muted">
          {new Date(challenge.startsAt).toLocaleString("vi-VN")} → {new Date(challenge.endsAt).toLocaleString("vi-VN")}
        </p>
      </div>
      <button
        onClick={() => onRemove(challenge.id)}
        className="rounded-lg p-2 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
        title="Xoá thử thách"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
