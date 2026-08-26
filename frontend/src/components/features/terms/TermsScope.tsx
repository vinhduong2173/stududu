"use client";

import * as React from "react";
import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";

export function TermsScope() {
  const t = useTranslations("terms");

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
        <Compass className="w-5 h-5" /> {t("section_1_title")}
      </h2>
      <p className="text-xs sm:text-sm text-muted leading-relaxed">
        {t("section_1_desc")}
      </p>
    </div>
  );
}
