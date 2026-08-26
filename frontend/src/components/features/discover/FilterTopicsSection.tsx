"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { Topic, SortKey } from "@/hooks/useDiscover";

interface FilterTopicsSectionProps {
  t: any;
  topics: Topic[];
  activeTopics: string[];
  setActiveTopics: React.Dispatch<React.SetStateAction<string[]>>;
  onlineOnly: boolean;
  setOnlineOnly: (val: boolean) => void;
  sort: SortKey;
  setSort: (val: SortKey) => void;
}

export function FilterTopicsSection({
  t,
  topics,
  activeTopics,
  setActiveTopics,
  onlineOnly,
  setOnlineOnly,
  sort,
  setSort,
}: FilterTopicsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Topics / Interests */}
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
          {t("discover.filter_interests") || "Sở thích chung"}
        </label>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 border border-border/60 rounded-2xl bg-surface-2/40">
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
                  "rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all cursor-pointer active:scale-95",
                  isActive
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-border/80 bg-surface text-muted hover:border-primary/40 hover:text-foreground"
                )}
              >
                {getTopicTranslation(topic.name, t)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Online Only Toggle */}
      <label className="flex items-center justify-between p-4 rounded-2xl bg-surface-2/60 border border-border/80 cursor-pointer transition-all hover:bg-surface-2">
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t("discover.filter_online") || "Đang hoạt động"}</span>
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
              "w-11 h-6 rounded-full transition-all duration-200",
              onlineOnly ? "bg-emerald-500" : "bg-slate-300 border border-border"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200",
                onlineOnly && "translate-x-5"
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
            { id: "best", label: t("discover.sort_best") || "Phù hợp nhất" },
            { id: "recent", label: t("discover.sort_recent") || "Hoạt động gần đây" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSort(item.id as SortKey)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95",
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
  );
}
