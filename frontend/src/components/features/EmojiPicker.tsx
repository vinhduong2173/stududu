"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const EMOJI_GROUPS = [
  { label: "😊", emojis: ["😀","😂","🥰","😊","😍","🤩","😎","🥳","😇","😋","🤗","😜","🙂","😐","🤔","😅","😬","😴","🤭","😏"] },
  { label: "❤️", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💗","💓","💞","💘","💝","💟","❣️","💔","🔥","✨","⭐"] },
  { label: "👋", emojis: ["👍","👎","👏","🙏","👋","🤝","✌️","🤞","☝️","🤟","💪","🫶","🎉","🎊","🎯","🏆","🌟","💡","📚","🎮"] },
];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [activeGroup, setActiveGroup] = React.useState(0);

  return (
    <div className="w-72 rounded-2xl bg-surface border border-border shadow-xl overflow-hidden">
      <div className="flex border-b border-border bg-muted/5">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label}
            onClick={() => setActiveGroup(i)}
            className={cn(
              "flex-1 py-2 text-lg transition-colors",
              activeGroup === i ? "bg-surface border-b-2 border-primary" : "hover:bg-surface/60",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 p-3 max-h-44 overflow-y-auto">
        {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-2xl hover:bg-primary/10 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
