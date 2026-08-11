"use client";

import * as React from "react";
import { Check, Clock } from "lucide-react";
import { TIMEZONES, TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import { Language, LEVEL_LABELS } from "@/hooks/useProfileEdit";

interface ProfileAvailabilitySectionProps {
  t: any;
  tOnboard: any;
  timezone: string;
  setTimezone: (val: string) => void;
  availableSlots: string[];
  setAvailableSlots: React.Dispatch<React.SetStateAction<string[]>>;
  languageFocus: string;
  setLanguageFocus: (val: string) => void;
  levelDesired: string;
  setLevelDesired: (val: string) => void;
  availableLanguages: Language[];
}

export function ProfileAvailabilitySection({
  t,
  tOnboard,
  timezone,
  setTimezone,
  availableSlots,
  setAvailableSlots,
  languageFocus,
  setLanguageFocus,
  levelDesired,
  setLevelDesired,
  availableLanguages,
}: ProfileAvailabilitySectionProps) {
  const selectClass =
    "flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 outline-none focus:border-primary";

  return (
    <>
      {/* Múi giờ + khung giờ rảnh */}
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> {t("availability")}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2">{t("timezone_label")}</label>
          <select
            className={`${selectClass} w-full`}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.code} value={tz.code}>
                {tz.flag} {tz.name} (UTC{tz.offset >= 0 ? "+" : ""}{tz.offset})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">{t("slots_title")}</label>
            <span className="text-xs font-semibold text-primary">{t("slots_selected", { count: availableSlots.length })}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = availableSlots.includes(slot.id);
              const disabled = !isSelected && availableSlots.length >= 2;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    !disabled &&
                    setAvailableSlots((prev) =>
                      isSelected ? prev.filter((s) => s !== slot.id) : [...prev, slot.id],
                    )
                  }
                  className={cn(
                    "rounded-xl p-3 text-left border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : disabled
                        ? "border-border bg-muted/10 opacity-50 cursor-not-allowed"
                        : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{slot.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <span className="text-xs text-muted">
                    {getTimezone(timezone).flag} {t("slots_time")} {getTimezone(timezone).name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-2">{t("slots_hint")}</p>
        </div>
      </section>

      {/* Tiêu chí ghép */}
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
        <h2 className="text-lg font-bold text-foreground">{t("matching_criteria")}</h2>
        <div>
          <label className="block text-sm font-medium mb-2">{t("preferred_language")}</label>
          <select className={`${selectClass} w-full`} value={languageFocus} onChange={(e) => setLanguageFocus(e.target.value)}>
            <option value="">{t("no_preference")}</option>
            {availableLanguages.map((l) => (
              <option key={l.id} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("desired_level")}</label>
          <select className={`${selectClass} w-full`} value={levelDesired} onChange={(e) => setLevelDesired(e.target.value)}>
            <option value="">{t("any_level")}</option>
            {Object.entries(LEVEL_LABELS).map(([v]) => (
              <option key={v} value={v}>{tOnboard(`level_${v}`)}</option>
            ))}
          </select>
        </div>
      </section>
    </>
  );
}
