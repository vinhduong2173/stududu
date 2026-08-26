"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageFlag } from "@/lib/languages";

interface LanguageItem {
  code: string;
  nameKey: "lang_en" | "lang_es" | "lang_fr" | "lang_de" | "lang_it" | "lang_pt" | "lang_ru" | "lang_ja" | "lang_zh" | "lang_ko" | "lang_vi";
  native: string;
}

const TARGET_LANGUAGES: LanguageItem[] = [
  { code: "en", nameKey: "lang_en", native: "English" },
  { code: "ja", nameKey: "lang_ja", native: "日本語" },
  { code: "ko", nameKey: "lang_ko", native: "한국어" },
  { code: "zh", nameKey: "lang_zh", native: "中文" },
  { code: "fr", nameKey: "lang_fr", native: "Français" },
  { code: "de", nameKey: "lang_de", native: "Deutsch" },
  { code: "es", nameKey: "lang_es", native: "Español" },
  { code: "vi", nameKey: "lang_vi", native: "Tiếng Việt" },
  { code: "it", nameKey: "lang_it", native: "Italiano" },
  { code: "pt", nameKey: "lang_pt", native: "Português" },
  { code: "ru", nameKey: "lang_ru", native: "Русский" },
];

export function LanguagePickerSection() {
  const t = useTranslations("home");

  return (
    <div id="languages" className="w-full bg-surface rounded-3xl p-6 sm:p-8 md:p-10 border border-border/80 shadow-card text-center">
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground font-display tracking-tight">
          {t("practice_title")}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {TARGET_LANGUAGES.map((lang) => (
          <Link
            key={lang.code}
            href="/register"
            className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-surface-2/70 hover:bg-white border border-border/80 hover:border-teal-500/50 hover:shadow-card transition-all duration-150 hover:-translate-y-0.5 group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-white border border-border/60 group-hover:border-primary shrink-0 flex items-center justify-center shadow-2xs">
              <LanguageFlag code={lang.code} className="w-full h-full rounded-full border-none shadow-none" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {t(lang.nameKey)}
              </div>
              <div className="text-[10px] text-muted truncate font-medium">
                {lang.native}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
