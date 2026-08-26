"use client";

import * as React from "react";
import { Volume2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageDisplayName, speakWord } from "@/hooks/useVocabulary";
import { SavedWord } from "@/components/features/WordSaveModal";

interface VocabularyWordCardProps {
  item: SavedWord;
  targetDef: string;
  isSelected: boolean;
  handleDeleteWord: (id: number, term: string) => void;
  t: any;
}

export function VocabularyWordCard({
  item,
  targetDef,
  isSelected,
  handleDeleteWord,
  t,
}: VocabularyWordCardProps) {
  const isMastered = item.status === "mastered";

  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 group hover:border-primary/40 bg-surface border-border hover:bg-surface-2/40 shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
        isSelected && "ring-2 ring-primary/40",
      )}
    >
      <div className="space-y-2 min-w-0 flex-1">
        {/* Term & Audio & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-foreground text-base tracking-tight font-display">
            {item.word.term}
          </span>
          <button
            type="button"
            onClick={() => speakWord(item.word.term, item.word.language?.code || "en")}
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer active:scale-95"
            title={t("btn_audio_tooltip")}
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <span
            className={cn(
              "text-[10px] font-extrabold rounded-full px-2.5 py-0.5 ml-auto border shadow-2xs",
              isMastered
                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                : "bg-amber-50 text-amber-800 border-amber-200/80",
            )}
          >
            {isMastered ? t("status_mastered_label") : t("status_learning_label")}
          </span>
        </div>

        {/* Definition */}
        <p className="text-xs sm:text-sm font-semibold text-foreground/90 leading-snug">
          {targetDef}
        </p>

        {/* Example Sentence */}
        {item.word.example && (
          <p className="text-xs text-muted italic line-clamp-2 leading-relaxed">
            &ldquo;{item.word.example}&rdquo;
          </p>
        )}

        {/* Language & Tag */}
        <div className="flex items-center gap-2 text-[10px] text-muted pt-1">
          <span className="bg-surface-2 px-2 py-0.5 rounded-md font-semibold text-muted-foreground border border-border/60">
            {getLanguageDisplayName(item)}
          </span>
          {item.word.phonetic && (
            <span className="text-muted font-mono">/{item.word.phonetic}/</span>
          )}
        </div>
      </div>

      {/* Delete Action */}
      <button
        type="button"
        onClick={() => void handleDeleteWord(item.id, item.word.term)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 cursor-pointer active:scale-95"
        title={t("btn_delete_tooltip")}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
