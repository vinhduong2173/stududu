"use client";

import * as React from "react";
import { Award, User, Sparkles } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { EndorsementBadges, ChatStats } from "@/components/features/Endorsements";
import { LanguagesCard } from "@/components/features/LanguagesCard";
import { ProfileAvailabilityCard } from "@/components/features/profile/ProfileAvailabilityCard";
import { getTopicTranslation, getIntentTranslation } from "@/lib/i18nHelper";

interface OtherUserSidebarProps {
  user: any;
  conversationId: number | null;
  endorseRefresh: number;
  setEndorseOpen: (val: boolean) => void;
  t: any;
  tRoot: any;
}

export function OtherUserSidebar({
  user,
  conversationId,
  endorseRefresh,
  setEndorseOpen,
  t,
  tRoot,
}: OtherUserSidebarProps) {
  return (
    <div className="space-y-6">
      {/* 1. Trust Signals (BR-13 Endorsement counts + BR-14 Chat Stats) */}
      <div className="bg-surface rounded-3xl p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-extrabold font-display text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span>{t("trust_activity_other")}</span>
          </h2>
          {conversationId && (
            <button
              onClick={() => setEndorseOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t("endorse_btn")}</span>
            </button>
          )}
        </div>
        <div className="space-y-3">
          <EndorsementBadges userId={user.id} refreshKey={endorseRefresh} />
          <ChatStats userId={user.id} />
        </div>
      </div>

      {/* 2. Intro Box */}
      <div className="bg-surface rounded-3xl p-6 shadow-card border border-border">
        <h2 className="text-base sm:text-lg font-extrabold font-display text-foreground mb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <span>{t("intro")}</span>
        </h2>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap text-xs sm:text-sm italic bg-surface-2/60 p-4 rounded-2xl border border-border/50 mb-4">
          {user.bio ? `"${user.bio}"` : t("no_intro_other")}
        </p>
        {user.intent && (
          <div>
            <span className="font-bold text-muted text-[11px] block uppercase tracking-wider mb-1.5">{t("intent")}</span>
            <Chip variant="outline" className="text-xs sm:text-sm font-semibold py-1 px-3">
              {getIntentTranslation(user.intent, tRoot)}
            </Chip>
          </div>
        )}
      </div>

      {/* 3. Languages Card */}
      <LanguagesCard languages={user.languages || []} />

      {/* 4. Availability Card */}
      <ProfileAvailabilityCard availableSlots={user.availableSlots} timezone={user.timezone} />

      {/* 5. Interests Card */}
      {user.interests && user.interests.length > 0 && (
        <div className="bg-surface rounded-3xl p-6 shadow-card border border-border">
          <h2 className="text-base sm:text-lg font-extrabold font-display text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>{t("interests")}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((i: any) => (
              <Chip key={i.id} variant="outline" className="text-xs py-1.5 px-3 rounded-xl font-medium">
                {getTopicTranslation(i.topic.name, tRoot)}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
