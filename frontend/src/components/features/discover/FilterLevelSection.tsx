"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LevelFilter } from "@/hooks/useDiscover";

interface FilterLevelSectionProps {
  t: any;
  levelFilter: LevelFilter;
  setLevelFilter: (val: LevelFilter) => void;
}

export function FilterLevelSection({ t, levelFilter, setLevelFilter }: FilterLevelSectionProps) {
  const levels: { id: LevelFilter; label: string }[] = [
    { id: "all", label: t("discover.filter_level_all") || "Tất cả" },
    { id: "native", label: t("discover.filter_level_native") || "Bản xứ" },
    { id: "fluent", label: t("discover.filter_level_fluent") || "Thành thạo" },
  ];

  return (
    <div>
      <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
        {t("discover.filter_level_label") || "Trình độ đối tác"}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {levels.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLevelFilter(item.id)}
            className={cn(
              "py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95",
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
  );
}
