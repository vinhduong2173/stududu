"use client";

import * as React from "react";
import { Search, Trash2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLanguageDisplayName,
  ListFilterType,
  speakWord,
} from "@/hooks/useVocabulary";
import { SavedWord } from "@/components/features/WordSaveModal";

interface VocabularyNotebookSectionProps {
  t: any;
  filteredWords: SavedWord[];
  listFilter: ListFilterType;
  setListFilter: (val: ListFilterType) => void;
  search: string;
  setSearch: (val: string) => void;
  selectedWordId: number | null;
  getDefinitionForTargetLang: (word: SavedWord) => string;
  handleDeleteWord: (id: number, term: string) => void;
}

export function VocabularyNotebookSection({
  t,
  filteredWords,
  listFilter,
  setListFilter,
  search,
  setSearch,
  selectedWordId,
  getDefinitionForTargetLang,
  handleDeleteWord,
}: VocabularyNotebookSectionProps) {
  return (
    <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-extrabold text-xl text-foreground">{t("notebook_heading")}</h2>
          <p className="text-xs text-muted mt-0.5">{t("notebook_subheading")}</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
          {t("total_count_label", { count: filteredWords.length })}
        </span>
      </div>

      {/* LIST FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "new", "learning", "mastered"] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setListFilter(filterKey)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border",
                listFilter === filterKey
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-surface text-muted border-border hover:border-primary/30",
              )}
            >
              {filterKey === "all" && t("filter_all")}
              {filterKey === "new" && t("filter_new")}
              {filterKey === "learning" && t("filter_learning")}
              {filterKey === "mastered" && t("filter_mastered")}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={t("search_placeholder_notebook")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-2xl border border-border bg-muted/5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* WORD ITEMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {filteredWords.length > 0 ? (
          filteredWords.map((item) => {
            const targetDef = getDefinitionForTargetLang(item);

            return (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group hover:border-primary/40 bg-surface border-border hover:bg-muted/5 shadow-sm",
                  selectedWordId === item.id && "ring-2 ring-primary/40",
                )}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-foreground text-base">
                      {item.word.term}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        speakWord(
                          item.word.term,
                          item.word.language?.code || "en",
                        )
                      }
                      className="p-1 rounded-md text-muted hover:text-primary transition-colors"
                      title={t("btn_audio_tooltip")}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={cn(
                        "text-[10px] font-bold rounded-full px-2.5 py-0.5 ml-auto",
                        item.status === "mastered"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                      )}
                    >
                      {item.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground/90">
                    {targetDef}
                  </p>

                  {item.word.example && (
                    <p className="text-xs text-muted italic truncate">
                      &quot;{item.word.example}&quot;
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-muted pt-1">
                    <span className="bg-muted/20 px-2 py-0.5 rounded-md font-medium">
                      {getLanguageDisplayName(item)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteWord(item.id, item.word.term)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                  title={t("btn_delete_tooltip")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-muted text-sm">
            {t("no_words_found")}
          </div>
        )}
      </div>
    </div>
  );
}
