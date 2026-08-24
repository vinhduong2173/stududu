"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { LevelFilter, Topic } from "@/hooks/useDiscover";

interface DiscoverFilterPanelProps {
  t: any;
  levelFilter: LevelFilter;
  setLevelFilter: (val: LevelFilter) => void;
  topics: Topic[];
  activeTopics: string[];
  setActiveTopics: React.Dispatch<React.SetStateAction<string[]>>;
  onlineOnly: boolean;
  setOnlineOnly: (val: boolean) => void;
  resetFilters: () => void;
}

export function DiscoverFilterPanel({
  t,
  levelFilter,
  setLevelFilter,
  topics,
  activeTopics,
  setActiveTopics,
  onlineOnly,
  setOnlineOnly,
  resetFilters,
}: DiscoverFilterPanelProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-surface shadow-card p-5 space-y-5">
      <h2 className="font-bold text-base text-foreground font-display flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" /> {t("discover.filter_title")}
      </h2>

      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
          {t("discover.filter_level_label")}
        </label>
        <select
          className="w-full rounded-xl border border-border/80 bg-surface-2/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
        >
          <option value="all">{t("discover.filter_level_all")}</option>
          <option value="native">{t("discover.filter_level_native")}</option>
          <option value="fluent">{t("discover.filter_level_fluent")}</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
          {t("discover.filter_interests")}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => {
            const isActive = activeTopics.includes(topic.name);
            return (
              <button
                key={topic.id}
                onClick={() =>
                  setActiveTopics((prev) =>
                    prev.includes(topic.name)
                      ? prev.filter((item) => item !== topic.name)
                      : [...prev, topic.name],
                  )
                }
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold border transition-all duration-150 cursor-pointer",
                  isActive
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground",
                )}
              >
                {getTopicTranslation(topic.name, t)}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group pt-1">
        <div className="relative">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              "w-9 h-5 rounded-full transition-all",
              onlineOnly ? "bg-emerald-500" : "bg-muted/20 border border-border",
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform",
                onlineOnly && "translate-x-4",
              )}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {t("discover.filter_online")}
        </span>
      </label>

      <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-muted hover:text-foreground" onClick={resetFilters}>
        {t("discover.filter_reset")}
      </Button>
    </div>
  );
}
