import * as React from "react";
import Link from "next/link";
import { getLanguageInfo, LanguageFlag, LevelBadge } from "@/lib/languages";
import { useTranslations } from "next-intl";

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

  const nativeLangs = languages.filter((l) => l.role === "native");
  const fluentLangs = languages.filter((l) => l.role === "fluent");
  const learnLangs = languages.filter((l) => l.role === "learning");

  const renderSection = (items: UserLanguageItem[], label: string, showLevel = false) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          {items.map((l) => {
            const info = getLanguageInfo(l.language.code, l.language.name);
            return (
              <div key={l.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <LanguageFlag code={l.language.code} name={l.language.name} className="w-7 h-7" />
                  <span className="text-sm font-medium text-foreground">{info.displayName}</span>
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
    <div className="bg-surface rounded-3xl p-6 shadow-xs border border-border">
      <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
        <h2 className="text-xl font-bold text-foreground">{t("languages")}</h2>
        {editHref && (
          <Link href={editHref} className="text-xs font-semibold text-primary hover:underline">
            {t("edit_btn")}
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {renderSection(nativeLangs, "NATIVE")}

        {hasNative && (hasFluent || hasLearning) && <div className="h-px bg-border/60 w-full" />}

        {renderSection(fluentLangs, "FLUENT")}

        {(hasNative || hasFluent) && hasLearning && <div className="h-px bg-border/60 w-full" />}

        {renderSection(learnLangs, "LEARNING", true)}

        {languages.length === 0 && <p className="text-xs text-muted py-2">{t("none")}</p>}
      </div>
    </div>
  );
}
