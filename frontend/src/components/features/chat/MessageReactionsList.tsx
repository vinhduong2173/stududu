"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MessageReactionsListProps {
  reactions?: Record<string, number[]> | null;
  meId: number;
  mine: boolean;
  onToggleReaction: (emoji: string) => void;
}

export function MessageReactionsList({
  reactions,
  meId,
  mine,
  onToggleReaction,
}: MessageReactionsListProps) {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1 px-1", mine ? "justify-end" : "justify-start")}>
      {Object.entries(reactions).map(([emoji, uids]) => {
        if (!uids || uids.length === 0) return null;
        const iReacted = uids.includes(meId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggleReaction(emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors",
              iReacted
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "bg-surface border-border text-muted hover:border-primary/50",
            )}
          >
            <span>{emoji}</span>
            <span>{uids.length}</span>
          </button>
        );
      })}
    </div>
  );
}
