"use client";

import * as React from "react";
import Link from "next/link";
import { Award, User, Target, MapPin, Clock, Sparkles } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ChatStats, EndorsementBadges } from "@/components/features/Endorsements";
import { LanguagesCard } from "@/components/features/LanguagesCard";
import { ProfileAvailabilityCard } from "@/components/features/profile/ProfileAvailabilityCard";
import { getTimezone } from "@/lib/timezones";
import { getIntentTranslation, getGenderTranslation, getTopicTranslation } from "@/lib/i18nHelper";

export interface ProfileSidebarProps {
  me: {
    id: number;
    displayName: string;
    bio?: string | null;
    intent?: string | null;
    gender?: string | null;
    city?: string | null;
    country?: string | null;
    timezone?: string | null;
    availableSlots?: string[];
    languages: { id: number; role: string; level?: string | null; language: { id?: number; code?: string; name: string } }[];
    interests: { id: number; topic: { name: string } }[];
  };
  t: any;
  tRoot: any;
}

export function ProfileSidebar({ me, t, tRoot }: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Trust Signals */}
      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <span>{t("trust_activity")}</span>
        </h2>
        <div className="space-y-3">
          <EndorsementBadges userId={me.id} />
          <ChatStats userId={me.id} />
        </div>
      </div>

      {/* Intro Box */}
      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <span>{t("intro")}</span>
          </span>
          <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
            {t("edit_btn")}
          </Link>
        </h2>

        <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm italic bg-surface-2/60 p-4 rounded-2xl border border-border/50 mb-4">
          {me.bio ? `"${me.bio}"` : t("no_intro_me")}
        </p>

        <div className="space-y-3 text-sm text-foreground">
          {me.intent && (
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-muted shrink-0" />
              <div>
                <span className="font-semibold text-muted text-xs block uppercase">{t("intent")}</span>
                <span className="font-medium text-foreground">{getIntentTranslation(me.intent, tRoot)}</span>
              </div>
            </div>
          )}

          {(me.city || me.country) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted shrink-0" />
              <div>
                <span className="font-semibold text-muted text-xs block uppercase">{t("lives_in")}</span>
                <span className="font-medium text-foreground">{[me.city, me.country].filter(Boolean).join(", ")}</span>
              </div>
            </div>
          )}

          {me.gender && (
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted shrink-0" />
              <div>
                <span className="font-semibold text-muted text-xs block uppercase">{t("gender_label")}</span>
                <span className="font-medium text-foreground">{getGenderTranslation(me.gender, tRoot)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted shrink-0" />
            <div>
              <span className="font-semibold text-muted text-xs block uppercase">{t("timezone_label_short")}</span>
              <span className="font-medium text-foreground">
                {getTimezone(me.timezone).name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Languages Card */}
      <LanguagesCard languages={me.languages} editHref="/profile/me/edit" />

      {/* Availability Card */}
      <ProfileAvailabilityCard
        availableSlots={me.availableSlots}
        timezone={me.timezone}
        editHref="/profile/me/edit"
      />

      {/* Interests Card */}
      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>{t("interests")}</span>
          </span>
          <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
            {t("edit_btn")}
          </Link>
        </h2>
        <div className="flex flex-wrap gap-2">
          {me.interests.length === 0 && <p className="text-xs text-muted">{t("none")}</p>}
          {me.interests.map((i) => (
            <Chip key={i.id} variant="outline" className="text-xs py-1 px-3 rounded-xl">
              {getTopicTranslation(i.topic.name, tRoot)}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
