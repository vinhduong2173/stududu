"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageFlag } from "@/lib/languages";

export function LanguagePickerSection() {
  const t = useTranslations("home");

  const targetLanguages = [
    { code: "en", nameKey: "lang_en" as const, countryCode: "gb" },
    { code: "es", nameKey: "lang_es" as const, countryCode: "es" },
    { code: "fr", nameKey: "lang_fr" as const, countryCode: "fr" },
    { code: "de", nameKey: "lang_de" as const, countryCode: "de" },
    { code: "it", nameKey: "lang_it" as const, countryCode: "it" },
    { code: "pt", nameKey: "lang_pt" as const, countryCode: "pt" },
    { code: "ru", nameKey: "lang_ru" as const, countryCode: "ru" },
    { code: "ja", nameKey: "lang_ja" as const, countryCode: "jp" },
    { code: "zh", nameKey: "lang_zh" as const, countryCode: "cn" },
    { code: "ko", nameKey: "lang_ko" as const, countryCode: "kr" },
    { code: "vi", nameKey: "lang_vi" as const, countryCode: "vn" },
  ];

  return (
    <div className="w-full bg-surface rounded-3xl p-6 sm:p-8 md:p-10 border border-border/80 shadow-card text-center">
      <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-display mb-6 sm:mb-8 tracking-tight">
        {t("practice_title")}
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 md:gap-9">
        {targetLanguages.map((lang) => (
          <Link
            key={lang.code}
            href="/register"
            className="flex flex-col items-center justify-center group cursor-pointer transition-all duration-200"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-surface border-2 border-border/80 group-hover:border-primary group-hover:shadow-lg transition-all duration-200 flex items-center justify-center shadow-xs group-hover:-translate-y-1">
              <LanguageFlag
                code={lang.code}
                className="w-full h-full rounded-full border-none shadow-none"
              />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-primary mt-2.5 transition-colors">
              {t(lang.nameKey)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
