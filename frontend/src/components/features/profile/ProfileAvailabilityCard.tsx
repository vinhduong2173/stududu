"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Globe, CheckCircle2, Circle } from "lucide-react";
import { TIME_SLOTS, getTimezone, currentTimeAt } from "@/lib/timezones";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ProfileAvailabilityCardProps {
  availableSlots?: string[];
  timezone?: string | null;
  editHref?: string;
}

export function ProfileAvailabilityCard({
  availableSlots = [],
  timezone,
  editHref,
}: ProfileAvailabilityCardProps) {
  const t = useTranslations("profile");
  const tz = getTimezone(timezone);
  const currentTime = currentTimeAt(tz.offset);
  const userSlots = availableSlots || [];

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-card border border-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span>{t("availability")}</span>
        </h2>
        {editHref && (
          <Link href={editHref} className="text-xs font-semibold text-primary hover:underline">
            {t("edit_btn")}
          </Link>
        )}
      </div>

      {/* Timezone Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-2/70 rounded-2xl border border-border/70 text-xs">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <span className="text-base">{tz.flag}</span>
          <span>{tz.name}</span>
          <span className="text-muted font-normal">
            (UTC{tz.offset >= 0 ? `+${tz.offset}` : tz.offset})
          </span>
        </div>
        <div className="text-muted font-medium flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{t("current_time_at")}</span>
          <span className="font-bold text-foreground">{currentTime}</span>
        </div>
      </div>

      {/* Time Slots Matrix Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TIME_SLOTS.map((slot) => {
            const isAvailable = userSlots.includes(slot.id);

            return (
              <div
                key={slot.id}
                className={cn(
                  "p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 text-xs",
                  isAvailable
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-2xs font-bold"
                    : "bg-surface-2/30 border-border/40 text-muted/60 font-medium"
                )}
              >
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-bold tracking-wider opacity-75">
                    {slot.start < 12 ? "Sáng" : slot.start < 18 ? "Chiều" : "Tối"}
                  </span>
                  <span className="text-xs font-bold leading-tight">{slot.label}</span>
                </div>

                {isAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted/30 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {userSlots.length === 0 && (
          <p className="text-xs text-muted italic text-center pt-1">
            {t("no_availability")}
          </p>
        )}
      </div>
    </div>
  );
}
