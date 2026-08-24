"use client";

import * as React from "react";
import { Clock, Globe, Heart, Tag } from "lucide-react";
import { getTimezone, TIME_SLOTS } from "@/lib/timezones";
import { UserInterestItem } from "./AdminUserDetailCard";

interface AdminUserInterestsCardProps {
  interests: UserInterestItem[];
  availableSlots?: string[];
  timezone?: string | null;
}

export function AdminUserInterestsCard({
  interests = [],
  availableSlots = [],
  timezone,
}: AdminUserInterestsCardProps) {
  const tz = getTimezone(timezone);

  return (
    <section className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" /> Sở thích & Thời gian rảnh
        </h2>
      </div>

      {/* Interests / Topics */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-muted flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-primary" /> Chủ đề quan tâm ({interests.length})
        </span>
        {interests.length === 0 ? (
          <p className="text-xs text-muted">Chưa chọn chủ đề nào.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {interests.map((item) => (
              <span
                key={item.id}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/15 text-foreground border border-border/60"
              >
                #{item.topic.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Available Slots & Timezone */}
      <div className="space-y-2 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" /> Khung giờ rảnh
          </span>
          <span className="text-muted font-medium">
            {tz.flag} {tz.name} (UTC{tz.offset >= 0 ? `+${tz.offset}` : tz.offset})
          </span>
        </div>

        {availableSlots.length === 0 ? (
          <p className="text-xs text-muted">Chưa thiết lập khung giờ rảnh.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slotId) => {
              const slot = TIME_SLOTS.find((s) => s.id === slotId);
              return (
                <span
                  key={slotId}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5"
                >
                  <Clock className="h-3 w-3" />
                  {slot ? slot.label : slotId}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
