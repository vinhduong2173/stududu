"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { LevelFilter, Topic } from "@/hooks/useDiscover";
import { ProFilterSection } from "./ProFilterSection";

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
  /** EP-11 — bộ lọc nâng cao theo múi giờ (gói Pro). */
  proFilterEnabled: boolean;
  timezoneFilter: string;
  applyTimezoneFilter: (timezone: string) => void;
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
  proFilterEnabled,
  timezoneFilter,
  applyTimezoneFilter,
}: DiscoverFilterPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5">
      <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" /> {t("discover.filter_title")}
      </h2>

      <div className="space-y-5">
        <ProFilterSection
          enabled={proFilterEnabled}
          timezone={timezoneFilter}
          onChange={applyTimezoneFilter}
        />

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
            {t("discover.filter_level_label")}
          </label>
          <select
            className="w-full rounded-xl border-2 border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-medium"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
          >
            <option value="all">{t("discover.filter_level_all")}</option>
            <option value="native">{t("discover.filter_level_native")}</option>
            <option value="fluent">{t("discover.filter_level_fluent")}</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
            {t("discover.filter_interests")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
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
                  "rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                  activeTopics.includes(topic.name)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/50 hover:text-foreground",
                )}
              >
                {getTopicTranslation(topic.name, t)}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-10 h-6 rounded-full border-2 transition-all",
                onlineOnly ? "bg-success border-success" : "bg-muted/20 border-border",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  onlineOnly && "translate-x-4",
                )}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {t("discover.filter_online")}
          </span>
        </label>

        <Button variant="ghost" size="sm" className="w-full" onClick={resetFilters}>
          {t("discover.filter_reset")}
        </Button>
      </div>
    </div>
  );
}
