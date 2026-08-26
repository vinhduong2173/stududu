"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrivacyNoSelling() {
  const t = useTranslations("privacy");

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-teal-200/60 dark:border-teal-900/40 shadow-xs space-y-3 bg-teal-500/5">
      <h2 className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" /> {t("section_2_title")}
      </h2>
      <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
        {t("section_2_desc")}
      </p>
    </div>
  );
}
