"use client";

import * as React from "react";
import { Eye, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function GuidelinesSafety() {
  const t = useTranslations("guidelines");

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-primary font-bold text-lg">
        <Eye className="w-5 h-5" />
        <h2>{t("safety_title")}</h2>
      </div>
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-2/60 border border-border/60 text-xs sm:text-sm text-muted leading-relaxed">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p>{t("safety_desc")}</p>
      </div>
    </div>
  );
}
