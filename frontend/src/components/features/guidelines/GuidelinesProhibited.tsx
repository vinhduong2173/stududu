"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function GuidelinesProhibited() {
  const t = useTranslations("guidelines");

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-rose-200/60 dark:border-rose-900/40 shadow-xs space-y-3 bg-rose-500/5">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
        <AlertTriangle className="w-5 h-5" />
        <h2>{t("prohibited_title")}</h2>
      </div>
      <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
        {t("prohibited_desc")}
      </p>
    </div>
  );
}
