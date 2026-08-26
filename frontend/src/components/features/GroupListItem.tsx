"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Globe, Users } from "lucide-react";
import { GroupItem } from "@/components/features/GroupModals";
import { cn } from "@/lib/utils";

interface GroupListItemProps {
  group: GroupItem;
  onOpenInfo: (id: number | string) => void;
}

export function GroupListItem({ group, onOpenInfo }: GroupListItemProps) {
  const isPrivate = group.privacy === "private";
  const [imgError, setImgError] = React.useState(false);
  const showImage = Boolean(group.avatarUrl || group.coverUrl) && !imgError;

  return (
    <div
      onClick={() => onOpenInfo(group.id)}
      className="group bg-surface rounded-2xl border border-border/70 p-3.5 sm:p-4 flex items-center justify-between gap-3.5 sm:gap-4 hover:border-primary/40 hover:bg-surface-2/40 transition-all shadow-xs cursor-pointer"
    >
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
            <span title="Riêng tư" className="shrink-0 text-rose-500">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="font-medium">{isPrivate ? "Riêng tư" : "Công khai"}</span>
          <span className="text-muted/40">·</span>
          <span className="font-semibold text-foreground/80">{group.memberCount} thành viên</span>
          {group.language && (
            <>
              <span className="text-muted/40">·</span>
              <span className="text-primary font-medium">{group.language.name}</span>
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

      {/* Right: Action Button */}
      <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/groups/${group.id}`}
          className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-surface-2 hover:bg-surface-3 text-foreground border border-border hover:border-slate-400 transition-all shadow-2xs"
        >
          Truy cập
        </Link>
      </div>
    </div>
  );
}
