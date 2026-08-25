"use client";

import * as React from "react";
import { SlidersHorizontal, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { LevelFilter, Topic, SortKey } from "@/hooks/useDiscover";

export interface DiscoverFilterModalProps {
  t: any;
  isOpen: boolean;
  onClose: () => void;
  levelFilter: LevelFilter;
  setLevelFilter: (val: LevelFilter) => void;
  topics: Topic[];
  activeTopics: string[];
  setActiveTopics: React.Dispatch<React.SetStateAction<string[]>>;
  onlineOnly: boolean;
  setOnlineOnly: (val: boolean) => void;
  sort: SortKey;
  setSort: (val: SortKey) => void;
  resetFilters: () => void;
  resultCount: number;
}

export function DiscoverFilterModal({
  t,
  isOpen,
  onClose,
  levelFilter,
  setLevelFilter,
  topics,
  activeTopics,
  setActiveTopics,
  onlineOnly,
  setOnlineOnly,
  sort,
  setSort,
  resetFilters,
  resultCount,
}: DiscoverFilterModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg text-foreground font-display">
              {t("discover.filter_title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="space-y-5 py-4 overflow-y-auto pr-1 flex-1">
          {/* Level Filter */}
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
              {t("discover.filter_level_label")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: t("discover.filter_level_all") },
                { id: "native", label: t("discover.filter_level_native") },
                { id: "fluent", label: t("discover.filter_level_fluent") },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLevelFilter(item.id as LevelFilter)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    levelFilter === item.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-surface text-muted border-border hover:border-slate-400 hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
              {t("discover.filter_interests")}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {topics.map((topic) => {
                const isActive = activeTopics.includes(topic.name);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      setActiveTopics((prev) =>
                        prev.includes(topic.name)
                          ? prev.filter((item) => item !== topic.name)
                          : [...prev, topic.name]
                      )
                    }
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold border transition-all cursor-pointer",
                      isActive
                        ? "border-primary bg-primary text-white shadow-xs"
                        : "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {getTopicTranslation(topic.name, t)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Online Only Toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl bg-surface-2/60 border border-border/60 cursor-pointer">
            <span className="text-sm font-semibold text-foreground">
              {t("discover.filter_online")}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-10 h-6 rounded-full transition-all",
                  onlineOnly ? "bg-emerald-500" : "bg-muted/30 border border-border"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-xs transition-transform",
                    onlineOnly && "translate-x-4"
                  )}
                />
              </div>
            </div>
          </label>

          {/* Sort Option */}
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
              {t("discover.filter_sort_label") || "Sắp xếp theo"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "best", label: t("discover.sort_best") },
                { id: "recent", label: t("discover.sort_recent") },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSort(item.id as SortKey)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    sort === item.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-surface text-muted border-border hover:border-slate-400 hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/80">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs font-bold text-muted hover:text-foreground flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("discover.filter_reset")}
          </Button>
          <Button
            size="default"
            onClick={onClose}
            className="flex-1 rounded-full sd-btn-gradient text-white font-bold text-xs sm:text-sm h-11"
          >
            {t("discover.filter_apply")} ({resultCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
