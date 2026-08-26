"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AgeRangeFilter, GenderFilter } from "@/hooks/useDiscover";

interface FilterDemographicsSectionProps {
  t: any;
  ageRange: AgeRangeFilter;
  setAgeRange: (val: AgeRangeFilter) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (val: GenderFilter) => void;
}

export function FilterDemographicsSection({
  t,
  ageRange,
  setAgeRange,
  genderFilter,
  setGenderFilter,
}: FilterDemographicsSectionProps) {
  const ages: { id: AgeRangeFilter; label: string }[] = [
    { id: "all", label: t("discover.filter_age_all") || "Tất cả" },
    { id: "16-22", label: "16 – 22" },
    { id: "23-30", label: "23 – 30" },
    { id: "31-45", label: "31 – 45" },
    { id: "45+", label: "45+" },
  ];

  const genders: { id: GenderFilter; label: string }[] = [
    { id: "all", label: t("discover.filter_gender_all") || "Tất cả" },
    { id: "male", label: t("discover.filter_gender_male") || "Nam" },
    { id: "female", label: t("discover.filter_gender_female") || "Nữ" },
    { id: "other", label: t("discover.filter_gender_other") || "Khác" },
  ];

  return (
    <div className="space-y-6">
      {/* Age Range Filter */}
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
          {t("discover.filter_age_label") || "Độ tuổi"}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAgeRange(item.id)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95",
                ageRange === item.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-surface text-muted border-border hover:border-slate-400 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Filter */}
      <div>
        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5 block">
          {t("discover.filter_gender_label") || "Giới tính"}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {genders.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGenderFilter(item.id)}
              className={cn(
                "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95",
                genderFilter === item.id
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
