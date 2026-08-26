"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Globe, Users } from "lucide-react";
import { GroupItem } from "@/components/features/GroupModals";
import { useTranslations, useLocale } from "next-intl";
import { getLanguageInfo, LanguageFlag } from "@/lib/languages";

interface GroupListItemProps {
  group: GroupItem;
}

export function GroupListItem({ group }: GroupListItemProps) {
  const t = useTranslations("groups");
  const locale = useLocale();
  const isPrivate = group.privacy === "private";
  const [imgError, setImgError] = React.useState(false);
  const showImage = Boolean(group.avatarUrl || group.coverUrl) && !imgError;

  const langInfo = group.language ? getLanguageInfo(group.language.code, group.language.name, locale) : null;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group bg-surface rounded-2xl border border-border/70 p-3.5 sm:p-4 flex items-center justify-between gap-3.5 sm:gap-4 hover:border-primary/40 hover:bg-surface-2/40 transition-all shadow-xs cursor-pointer block"
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
        {/* Left: Square Thumbnail / Avatar */}
        <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-primary/10 border border-border/50 flex items-center justify-center">
          {showImage ? (
            <img
              src={(group.avatarUrl || group.coverUrl)!}
              alt={group.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full sd-btn-gradient text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-inner">
              {group.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Middle: Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-foreground font-display truncate group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            {isPrivate && (
              <span title={t("private")} className="shrink-0 text-rose-500">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium">{isPrivate ? t("private") : t("public")}</span>
            <span className="text-muted/40">·</span>
            <span className="font-semibold text-foreground/80">
              {t("members_count", { count: group.memberCount })}
            </span>
            {group.language && langInfo && (
              <>
                <span className="text-muted/40">·</span>
                <span className="inline-flex items-center gap-1 text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                  <LanguageFlag code={group.language.code} className="w-3.5 h-3.5" />
                  <span>{langInfo.displayName}</span>
                </span>
              </>
            )}
            {group.description && (
              <>
                <span className="text-muted/40">·</span>
                <span className="line-clamp-1 text-muted/70 max-w-[200px] sm:max-w-md">
                  {group.description}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Action Button */}
      <div className="shrink-0">
        <span className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-surface-2 group-hover:bg-primary group-hover:text-white text-foreground border border-border group-hover:border-primary transition-all shadow-2xs">
          {t("access")}
        </span>
      </div>
    </Link>
  );
}
