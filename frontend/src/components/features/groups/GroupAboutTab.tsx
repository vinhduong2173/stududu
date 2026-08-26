"use client";

import * as React from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  Calendar,
  User,
  ShieldAlert,
  BookOpen,
  Sparkles,
  Award,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { GroupItem } from "@/components/features/GroupModals";
import { useTranslations, useLocale } from "next-intl";
import { getLanguageInfo, LanguageFlag } from "@/lib/languages";

interface GroupAboutTabProps {
  group: GroupItem;
}

export function GroupAboutTab({ group }: GroupAboutTabProps) {
  const t = useTranslations("groups");
  const locale = useLocale();
  const isPrivate = group.privacy === "private";
  const langInfo = group.language ? getLanguageInfo(group.language.code, group.language.name, locale) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 cols: Main About Description & Rules */}
      <div className="lg:col-span-2 space-y-6">
        {/* Main Description */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>{t("group_about_title")}</span>
          </h2>

          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-surface-2/50 p-4 rounded-2xl border border-border/50">
            {group.description || t("not_specified")}
          </div>
        </div>

        {/* Target Language Feature Card */}
        {group.language && langInfo && (
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <LanguageFlag code={group.language.code} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground font-display">
                  {t("language_label", { name: langInfo.displayName })}
                </h3>
                <p className="text-xs text-muted">
                  {langInfo.nativeName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Group Guidelines / Rules */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>{t("effective_practice_title")}</span>
          </h2>

          <div className="space-y-3 text-xs text-foreground/80">
            <div className="p-3.5 rounded-2xl bg-surface-2/40 border border-border/40 space-y-1">
              <p className="font-bold text-foreground">1. Active participation</p>
              <p className="text-muted leading-relaxed">
                {t("effective_practice_desc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right 1 col: Details & Metadata */}
      <div className="space-y-6">
        {/* Privacy & Visibility */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground font-display">
            {t("privacy_label")}
          </h3>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              {isPrivate ? <Lock className="w-4 h-4 text-rose-500" /> : <Globe className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {isPrivate ? t("private") : t("public")}
              </p>
              <p className="text-xs text-muted leading-relaxed mt-0.5">
                {isPrivate ? t("private_desc") : t("public_desc")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border/60 pt-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{t("created_by", { name: group.creator.displayName })}</p>
              <p className="text-xs text-muted leading-relaxed mt-0.5">
                {new Date(group.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground font-display">
            Creator
          </h3>

          <Link
            href={`/profile/${group.creator.id}`}
            className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2/50 border border-border/50 hover:bg-surface-2 hover:border-border transition-all group"
          >
            <Avatar
              src={group.creator.avatarUrl ?? undefined}
              fallback={group.creator.displayName?.charAt(0) || "U"}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {group.creator.displayName}
              </p>
              <p className="text-xs text-muted font-medium">{t("created_by", { name: "" })}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
