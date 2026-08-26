"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrivacyHeader() {
  const t = useTranslations("privacy");

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border shadow-xs text-center space-y-3">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-1">
        <Lock className="w-7 h-7" />
      </div>
      <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground font-display tracking-tight">
        {t("title")}
      </h1>
      <p className="text-muted text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
        {t("last_updated")}
      </p>
    </div>
  );
}
