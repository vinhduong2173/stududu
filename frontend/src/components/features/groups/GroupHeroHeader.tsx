"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Lock,
  Globe,
  UserPlus,
  LogOut,
  Share2,
  Check,
  Sparkles,
  MessageSquare,
  FileText,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GroupItem } from "@/components/features/GroupModals";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { getLanguageInfo, LanguageFlag } from "@/lib/languages";

export type GroupTabType = "discussion" | "about" | "members" | "moderation";

interface GroupHeroHeaderProps {
  group: GroupItem;
  activeTab: GroupTabType;
  setActiveTab: (tab: GroupTabType) => void;
  isAdmin: boolean;
  pendingCount: number;
  actionLoading: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onShare: () => void;
}

export function GroupHeroHeader({
  group,
  activeTab,
  setActiveTab,
  isAdmin,
  pendingCount,
  actionLoading,
  onJoin,
  onLeave,
  onShare,
}: GroupHeroHeaderProps) {
  const t = useTranslations("groups");
  const locale = useLocale();
  const router = useRouter();
  const isPrivate = group.privacy === "private";

  const langInfo = group.language ? getLanguageInfo(group.language.code, group.language.name, locale) : null;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/community?tab=groups")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-surface hover:bg-surface-2 text-xs font-bold text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>{t("back_to_list")}</span>
        </button>

        <button
          onClick={onShare}
          className="p-2 sm:px-3.5 sm:py-2 rounded-full border border-border bg-surface hover:bg-surface-2 text-xs font-semibold text-muted hover:text-foreground transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          title={t("share")}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("share")}</span>
        </button>
      </div>

      {/* Facebook-style Group Cover Banner & Info */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-64 md:h-72 w-full bg-gradient-to-r from-primary/30 via-pink-500/20 to-warning/30 overflow-hidden">
          {group.coverUrl ? (
            <img
              src={group.coverUrl}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/30">
              <Sparkles className="w-20 h-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Group Header Info */}
        <div className="p-4 sm:p-6 md:p-8 pt-0 relative space-y-5">
          {/* Avatar & Title Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-12 sm:-mt-14 md:-mt-16">
            {/* Left: Avatar + Title & Meta */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Group Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl border-4 border-surface shadow-xl bg-surface overflow-hidden flex items-center justify-center text-primary font-black text-3xl sm:text-4xl font-display shrink-0">
                {group.avatarUrl ? (
                  <img
                    src={group.avatarUrl}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full sd-btn-gradient text-white flex items-center justify-center font-black">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1.5 pb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground font-display">
                  {group.name}
                </h1>

                <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs text-muted font-medium flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-foreground/80">
                    {isPrivate ? (
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span>{isPrivate ? t("private") : t("public")}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    {t("members_count", { count: group.memberCount })}
                  </span>
                  {group.language && langInfo && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full text-xs">
                        <LanguageFlag code={group.language.code} className="w-3.5 h-3.5" />
                        <span>{langInfo.displayName}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Join / Leave Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0 pb-1">
              {group.userContext.isMember ? (
                <Button
                  variant="outline"
                  onClick={onLeave}
                  disabled={actionLoading}
                  className="rounded-full text-xs font-bold gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-10 px-5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("leave")}</span>
                </Button>
              ) : group.userContext.hasPendingRequest ? (
                <Button
                  disabled
                  className="rounded-full text-xs font-bold gap-2 bg-amber-500/20 text-amber-600 border border-amber-500/30 h-10 px-5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t("request_pending")}</span>
                </Button>
              ) : (
                <Button
                  onClick={onJoin}
                  disabled={actionLoading}
                  className="sd-btn-gradient rounded-full text-xs font-bold gap-2 shadow-sm h-10 px-6 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t("join")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Facebook-style Tabs Navigation Bar */}
          <div className="border-t border-border/80 pt-2 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("discussion")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === "discussion"
                  ? "bg-primary/10 text-primary font-extrabold"
                  : "text-muted hover:text-foreground hover:bg-surface-2"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t("tab_discussion")}</span>
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === "about"
                  ? "bg-primary/10 text-primary font-extrabold"
                  : "text-muted hover:text-foreground hover:bg-surface-2"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>{t("tab_about")}</span>
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === "members"
                  ? "bg-primary/10 text-primary font-extrabold"
                  : "text-muted hover:text-foreground hover:bg-surface-2"
              )}
            >
              <Users className="w-4 h-4" />
              <span>{t("tab_members")}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted">
                {group.memberCount}
              </span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab("moderation")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                  activeTab === "moderation"
                    ? "bg-primary/10 text-primary font-extrabold"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t("tab_moderation")}</span>
                {pendingCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
