"use client";

import * as React from "react";
import Link from "next/link";
import { getLanguageInfo, LanguageFlag, LevelBadge } from "@/lib/languages";
import { useLocale, useTranslations } from "next-intl";
import { Languages, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserLanguageItem {
  id: number;
  role: string;
  level?: string | null;
  language: {
    id?: number;
    code?: string;
    name: string;
  };
}

export interface LanguagesCardProps {
  languages: UserLanguageItem[];
  editHref?: string;
}

export function LanguagesCard({
  languages,
  editHref,
}: LanguagesCardProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

  const nativeLangs = languages.filter((l) => l.role === "native");
  const fluentLangs = languages.filter((l) => l.role === "fluent");
  const learnLangs = languages.filter((l) => l.role === "learning");

  const renderSection = (
    items: UserLanguageItem[],
    title: string,
    badgeColor: string,
    showLevel = false
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
              badgeColor
            )}
          >
            {title}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {items.map((l) => {
            const info = getLanguageInfo(l.language.code, l.language.name, locale);
            return (
              <div
                key={l.id}
                className="flex items-center justify-between p-3 bg-surface-2/60 rounded-2xl border border-border/60 hover:border-primary/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 shadow-2xs rounded-full overflow-hidden">
                    <LanguageFlag
                      code={l.language.code}
                      name={l.language.name}
                      className="w-8 h-8"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-foreground block truncate">
                      {info.displayName}
                    </span>
                    {info.nativeName && info.nativeName !== info.displayName && (
                      <span className="text-xs text-muted block truncate font-medium">
                        {info.nativeName}
                      </span>
                    )}
                  </div>
                </div>

                {showLevel && <LevelBadge level={l.level} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasNative = nativeLangs.length > 0;
  const hasFluent = fluentLangs.length > 0;
  const hasLearning = learnLangs.length > 0;

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-card border border-border space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
          <Languages className="w-5 h-5 text-primary" />
          <span>{t("languages")}</span>
        </h2>
        {editHref && (
          <Link href={editHref} className="text-xs font-semibold text-primary hover:underline">
            {t("edit_btn")}
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {renderSection(
          nativeLangs,
          t("speaks_native"),
          "bg-teal-50 text-teal-800 border-teal-200"
        )}

        {hasNative && (hasFluent || hasLearning) && (
          <div className="h-px bg-border/60 w-full" />
        )}

        {renderSection(
          fluentLangs,
          t("speaks_fluent"),
          "bg-sky-50 text-sky-800 border-sky-200"
        )}

        {(hasNative || hasFluent) && hasLearning && (
          <div className="h-px bg-border/60 w-full" />
        )}

        {renderSection(
          learnLangs,
          t("learning"),
          "bg-rose-50 text-rose-800 border-rose-200",
          true
        )}

        {languages.length === 0 && (
          <p className="text-xs text-muted py-2">{t("none")}</p>
        )}
      </div>
    </div>
  );
}
