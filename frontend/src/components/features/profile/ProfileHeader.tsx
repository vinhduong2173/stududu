"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Pencil, Settings } from "lucide-react";
import { ageFromDob } from "@/lib/utils";
import { getGenderTranslation } from "@/lib/i18nHelper";
import { useTranslations } from "next-intl";
import { WorldMapBanner } from "./WorldMapBanner";

interface ProfileHeaderProps {
  me: {
    avatarUrl?: string | null;
    displayName: string;
    email: string;
    dob?: string | null;
    city?: string | null;
    country?: string | null;
    gender?: string | null;
  };
  t: any;
}

export function ProfileHeader({ me, t }: ProfileHeaderProps) {
  const tRoot = useTranslations();

  return (
    <div className="w-full bg-surface border-b border-border shadow-xs mb-8">
      {/* Full-width World Map Banner */}
      <WorldMapBanner />

      {/* Centered Profile Info & Avatar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 text-center">
        {/* Centered Avatar */}
        <div className="-mt-14 sm:-mt-16 md:-mt-20 flex justify-center relative z-10">
          <Avatar
            src={me.avatarUrl ?? undefined}
            fallback={me.displayName.charAt(0)}
            size="2xl"
            className="shadow-xl"
          />
        </div>

        {/* User Name & Age */}
        <div className="mt-3.5 space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {me.displayName}
            {ageFromDob(me.dob) !== null && (
              <span className="font-medium text-muted">, {ageFromDob(me.dob)}</span>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-muted flex items-center justify-center gap-1.5 flex-wrap">
            {[
              me.email,
              me.gender ? getGenderTranslation(me.gender, tRoot) : null,
              me.city,
              me.country,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-4">
          <Button asChild size="sm" className="rounded-full px-5 shadow-xs font-semibold">
            <Link href="/profile/me/edit">
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> {t("edit_profile")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full px-4 font-semibold">
            <Link href="/settings">
              <Settings className="h-3.5 w-3.5 mr-1.5" /> {t("settings")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
