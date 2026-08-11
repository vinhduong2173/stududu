"use client";

import * as React from "react";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoverTab } from "@/hooks/useDiscover";

interface DiscoverHeaderProps {
  t: any;
  tab: DiscoverTab;
  switchTab: (tab: DiscoverTab) => void;
  search: string;
  setSearch: (search: string) => void;
}

export function DiscoverHeader({
  t,
  tab,
  switchTab,
  search,
  setSearch,
}: DiscoverHeaderProps) {
  return (
    <>
      {/* Hero header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-secondary" />
          <span className="text-sm font-semibold text-secondary uppercase tracking-wide">
            {t("discover.hero_label")}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">{t("discover.title")}</h1>
        <p className="text-muted mt-1">{t("discover.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => switchTab("suggest")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
            tab === "suggest"
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          🔄 {t("discover.tab_suggest")}
        </button>
        <button
          onClick={() => switchTab("all")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
            tab === "all"
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          👥 {t("discover.tab_all")}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder={t("discover.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 rounded-full border-2 border-border bg-surface pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
        />
      </div>
    </>
  );
}
