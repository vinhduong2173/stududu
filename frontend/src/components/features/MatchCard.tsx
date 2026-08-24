"use client";

import * as React from "react";
import Link from "next/link";
import { LanguageFlag } from "@/lib/languages";
import { ageFromDob, cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

export interface MatchCardProps {
  user: {
    id: number;
    displayName: string;
    avatarUrl?: string;
    lastActive?: string;
    dob?: string | null;
    city?: string | null;
    bio?: string | null;
    intent?: string | null;
    languages: any[];
    createdAt?: string;
  };
  whyMatched?: {
    sharedTopics?: string[];
  };
}

export function MatchCard({ user, whyMatched }: MatchCardProps) {
  const t = useTranslations("discover");
  const isOnline = React.useMemo(
    () => (user.lastActive ? new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false),
    [user.lastActive]
  );

  const teachLangs = user.languages?.filter((l) => l.role === "native" || l.role === "fluent") || [];
  const learnLangs = user.languages?.filter((l) => l.role === "learning") || [];
  const age = ageFromDob(user.dob);
  const hasShared = whyMatched?.sharedTopics && whyMatched.sharedTopics.length > 0;
  
  const isNew = React.useMemo(() => {
    if (!user.createdAt) return false;
    return new Date(user.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
  }, [user.createdAt]);

  return (
    <Link
      href={`/profile/${user.id}`}
      className="group relative flex items-stretch gap-4 sm:gap-5 rounded-3xl bg-surface border border-border/80 p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 overflow-hidden cursor-pointer"
    >
      {/* Left Column: Square Photo / Avatar */}
      <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-surface-2 border border-border/50">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold text-3xl sm:text-4xl">
            {user.displayName?.charAt(0) || "U"}
          </div>
        )}

        {/* Online Indicator */}
        <span
          className={cn(
            "absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full border-2 border-surface shadow-xs",
            isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
          )}
          title={isOnline ? t("card_online") : t("card_recent")}
        />
      </div>

      {/* Right Column: User Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        {/* Top: Name & Badges */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-base sm:text-lg text-foreground font-display truncate leading-tight group-hover:text-primary transition-colors">
              {user.displayName}
              {age !== null && <span className="font-medium text-muted text-sm sm:text-base">, {age}</span>}
            </h3>

            {/* Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {hasShared ? (
                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Chung sở thích</span>
                </span>
              ) : isNew ? (
                <span className="bg-teal-500 text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {t("new_badge") || "NEW"}
                </span>
              ) : null}
            </div>
          </div>

          {/* Middle: Bio / Topic Snippet */}
          <p className="text-xs sm:text-sm text-muted/90 line-clamp-2 leading-relaxed my-1.5 min-h-[36px] sm:min-h-[42px]">
            {user.bio || (hasShared ? whyMatched!.sharedTopics!.join(", ") : "Học và trao đổi ngôn ngữ cùng stududu.")}
          </p>
        </div>

        {/* Bottom: Language Exchange (FLUENT & LEARNS) */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold text-muted border-t border-border/50 pt-2 mt-auto">
          {/* Fluent */}
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider text-[10px] sm:text-[11px] text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-md font-black">
              {t("fluent_tag") || "FLUENT"}
            </span>
            <div className="flex items-center gap-1">
              {teachLangs.slice(0, 2).map((l) => (
                <LanguageFlag key={l.id || l.languageId} code={l.language?.code} name={l.language?.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-xs" />
              ))}
              {teachLangs.length > 2 && <span className="text-xs text-muted">+{teachLangs.length - 2}</span>}
            </div>
          </div>

          <span className="text-muted/40 font-normal">·</span>

          {/* Learns */}
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider text-[10px] sm:text-[11px] text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md font-black">
              {t("learns_tag") || "LEARNS"}
            </span>
            <div className="flex items-center gap-1">
              {learnLangs.slice(0, 2).map((l) => (
                <LanguageFlag key={l.id || l.languageId} code={l.language?.code} name={l.language?.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-xs" />
              ))}
              {learnLangs.length > 2 && <span className="text-xs text-muted">+{learnLangs.length - 2}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
