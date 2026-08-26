"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListFilterType } from "@/hooks/useVocabulary";
import { SavedWord } from "@/components/features/WordSaveModal";
import { VocabularyWordCard } from "./VocabularyWordCard";

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
  undoItem?: { word: SavedWord; index: number } | null;
  handleUndoDelete?: () => void;
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
  undoItem,
  handleUndoDelete,
}: VocabularyNotebookSectionProps) {
  return (
    <div className="bg-surface rounded-3xl border border-border shadow-card p-6 sm:p-8 space-y-6 relative">
      {/* Heading & Total count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="font-extrabold text-xl sm:text-2xl text-foreground font-display tracking-tight">
            {t("notebook_heading")}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">{t("notebook_subheading")}</p>
        </div>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200/80 self-start sm:self-auto shadow-2xs">
          {t("total_count_label", { count: filteredWords.length })}
        </span>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "new", "learning", "mastered"] as const).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setListFilter(filterKey)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-extrabold shrink-0 transition-all border cursor-pointer active:scale-95",
                listFilter === filterKey
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-surface text-muted border-border hover:border-slate-400 hover:text-foreground",
              )}
            >
              {filterKey === "all" && t("filter_all")}
              {filterKey === "new" && t("filter_new")}
              {filterKey === "learning" && t("filter_learning")}
              {filterKey === "mastered" && t("filter_mastered")}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={t("search_placeholder_notebook")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-full border border-border bg-surface pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-1">
        {filteredWords.length > 0 ? (
          filteredWords.map((item) => (
            <VocabularyWordCard
              key={item.id}
              item={item}
              targetDef={getDefinitionForTargetLang(item)}
              isSelected={selectedWordId === item.id}
              handleDeleteWord={handleDeleteWord}
              t={t}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-muted text-sm font-medium">
            {t("no_words_found")}
          </div>
        )}
      </div>

      {/* Floating Undo Banner */}
      {undoItem && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <span className="text-xs sm:text-sm font-medium">
            {t("deleted_toast_message", { term: undoItem.word.word.term })}
          </span>
          {handleUndoDelete && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-bold underline transition-colors cursor-pointer"
            >
              {t("undo_btn") || "Hoàn tác"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
