"use client";

import * as React from "react";
import { Sparkles, Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function AboutMissionFeatures() {
  const t = useTranslations("about");

  const features = [
    {
      title: t("feature_1_title"),
      desc: t("feature_1_desc"),
    },
    {
      title: t("feature_2_title"),
      desc: t("feature_2_desc"),
    },
    {
      title: t("feature_3_title"),
      desc: t("feature_3_desc"),
    },
    {
      title: t("feature_4_title"),
      desc: t("feature_4_desc"),
    },
  ];

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-6 text-sm text-foreground leading-relaxed">
      <section className="space-y-2.5">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> {t("mission_title")}
        </h2>
        <p className="text-muted leading-relaxed">{t("mission_desc")}</p>
      </section>

      <section className="space-y-3 pt-4 border-t border-border/60">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" /> {t("features_title")}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((item, idx) => (
            <li
              key={idx}
              className="p-3.5 rounded-2xl bg-surface-2/60 border border-border/50 flex flex-col gap-1"
            >
              <span className="font-semibold text-foreground">{item.title}</span>
              <span className="text-xs text-muted leading-relaxed">
                {item.desc}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
