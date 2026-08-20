"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Pencil, Settings, FileText, User } from "lucide-react";
import { ageFromDob, cn } from "@/lib/utils";
import { getGenderTranslation } from "@/lib/i18nHelper";
import { useTranslations } from "next-intl";

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
  activeTab: "posts" | "about";
  setActiveTab: (tab: "posts" | "about") => void;
  t: any;
}

export function ProfileHeader({ me, activeTab, setActiveTab, t }: ProfileHeaderProps) {
  const tRoot = useTranslations();
  return (
    <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
      {/* Cover Photo Banner */}
      <div className="sd-cover relative h-44 sm:h-60 md:h-72 lg:h-80 w-full group">
        <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="inline-block rounded-full ring-4 ring-surface bg-surface">
            <Avatar
              src={me.avatarUrl ?? undefined}
              fallback={me.displayName.charAt(0)}
              size="xl"
              className="shadow-lg"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button asChild size="sm">
              <Link href="/profile/me/edit">
                <Pencil className="h-4 w-4 mr-2" /> {t("edit_profile")}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" /> {t("settings")}
              </Link>
            </Button>
          </div>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          {me.displayName}
          {ageFromDob(me.dob) !== null && (
            <span className="font-medium text-muted">, {ageFromDob(me.dob)}</span>
          )}
        </h1>
        <p className="text-muted mt-1">{me.email}</p>
        {(me.city || me.gender || me.country) && (
          <p className="text-sm text-muted mt-1">
            {[me.gender ? getGenderTranslation(me.gender, tRoot) : null, me.city, me.country].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Navigation Tabs */}
        <div className="border-t border-border pt-3 mt-4">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab("posts")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === "posts"
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground hover:bg-surface-2"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>{t("tab_posts")}</span>
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === "about"
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground hover:bg-surface-2"
              )}
            >
              <User className="w-4 h-4" />
              <span>{t("tab_about")}</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
