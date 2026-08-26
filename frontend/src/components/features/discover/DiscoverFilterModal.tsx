"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterLevelSection } from "./FilterLevelSection";
import { FilterDemographicsSection } from "./FilterDemographicsSection";
import { FilterTopicsSection } from "./FilterTopicsSection";
import { LevelFilter, Topic, SortKey, AgeRangeFilter, GenderFilter } from "@/hooks/useDiscover";

export interface DiscoverFilterModalProps {
  t: any;
  isOpen: boolean;
  onClose: () => void;
  levelFilter: LevelFilter;
  setLevelFilter: (val: LevelFilter) => void;
  ageRange: AgeRangeFilter;
  setAgeRange: (val: AgeRangeFilter) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (val: GenderFilter) => void;
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

export function DiscoverFilterModal(props: DiscoverFilterModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={props.onClose}
      />

      {/* Slide-over Drawer from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-surface/90 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={props.onClose}
                className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 h-8"
              >
                {props.t("discover.filter_apply") || "Apply"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={props.resetFilters}
                className="rounded-full text-xs font-semibold text-muted hover:text-foreground border-border hover:bg-surface-2 h-8 px-3"
              >
                {props.t("discover.filter_reset") || "Reset"}
              </Button>
            </div>

            <button
              onClick={props.onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Filters Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <FilterLevelSection
              t={props.t}
              levelFilter={props.levelFilter}
              setLevelFilter={props.setLevelFilter}
            />

            <FilterDemographicsSection
              t={props.t}
              ageRange={props.ageRange}
              setAgeRange={props.setAgeRange}
              genderFilter={props.genderFilter}
              setGenderFilter={props.setGenderFilter}
            />

            <FilterTopicsSection
              t={props.t}
              topics={props.topics}
              activeTopics={props.activeTopics}
              setActiveTopics={props.setActiveTopics}
              onlineOnly={props.onlineOnly}
              setOnlineOnly={props.setOnlineOnly}
              sort={props.sort}
              setSort={props.setSort}
            />
          </div>

          {/* Sticky Bottom Bar */}
          <div className="p-4 border-t border-border/80 bg-surface/90">
            <Button
              size="default"
              onClick={props.onClose}
              className="w-full rounded-full sd-btn-gradient text-white font-bold text-sm h-11 shadow-sm cursor-pointer"
            >
              {props.t("discover.filter_apply") || "Áp dụng bộ lọc"} ({props.resultCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
