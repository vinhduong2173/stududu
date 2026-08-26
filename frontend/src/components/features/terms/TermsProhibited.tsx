"use client";

import * as React from "react";
import { AlertCircle, Ban } from "lucide-react";
import { useTranslations } from "next-intl";

export function TermsProhibited() {
  const t = useTranslations("terms");

  const prohibitedItems = [
    t("prohibited_item_1"),
    t("prohibited_item_2"),
    t("prohibited_item_3"),
    t("prohibited_item_4"),
  ];

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
      <h2 className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
        <Ban className="w-5 h-5" /> {t("section_3_title")}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prohibitedItems.map((item, idx) => (
          <li
            key={idx}
            className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-200/50 dark:border-rose-900/30 flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
