"use client";

import * as React from "react";
import { Search, Sparkles, Users, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoverTab } from "@/hooks/useDiscover";

interface DiscoverHeaderProps {
  t: any;
  tab: DiscoverTab;
  switchTab: (tab: DiscoverTab) => void;
  search: string;
  setSearch: (search: string) => void;
  activeFilterCount: number;
  onOpenFilter: () => void;
}

export function DiscoverHeader({
  t,
  tab,
  switchTab,
  search,
  setSearch,
  activeFilterCount,
  onOpenFilter,
}: DiscoverHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6 mb-8">
      {/* Tandem-style Pill Tabs (Left side) */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => switchTab("suggest")}
          className={cn(
            "rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-2xs",
            tab === "suggest"
              ? "bg-slate-900 text-white shadow-card"
              : "bg-surface text-muted hover:text-foreground border border-border hover:bg-surface-2"
          )}
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{t("discover.tab_suggest")}</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab("all")}
          className={cn(
            "rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-2xs",
            tab === "all"
              ? "bg-slate-900 text-white shadow-card"
              : "bg-surface text-muted hover:text-foreground border border-border hover:bg-surface-2"
          )}
        >
          <Users className="w-4 h-4" />
          <span>{t("discover.tab_all")}</span>
        </button>
      </div>

      {/* Search Bar + Filter Button (Right side) */}
      <div className="flex items-center gap-3 flex-1 max-w-lg lg:max-w-xl md:ml-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={t("discover.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 sm:h-13 rounded-full border border-border bg-surface pl-11 sm:pl-13 pr-5 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted/70 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-card"
          />
        </div>

        {/* Filter Popup Button */}
        <button
          type="button"
          onClick={onOpenFilter}
          title={t("discover.filter_title")}
          className={cn(
            "relative h-12 w-12 sm:h-13 sm:w-13 shrink-0 rounded-full border flex items-center justify-center transition-all duration-150 cursor-pointer shadow-card hover:-translate-y-0.5 active:scale-95",
            activeFilterCount > 0
              ? "bg-primary text-white border-primary shadow-xs"
              : "bg-surface text-muted hover:text-foreground border-border hover:bg-surface-2"
          )}
        >
          <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-surface shadow-xs animate-scale-in">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
