"use client";

import * as React from "react";
import { HeartHandshake, Sparkles, Globe, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function GuidelinesCoreRules() {
  const t = useTranslations("guidelines");

  const rules = [
    {
      icon: HeartHandshake,
      iconClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      title: t("rule_1_title"),
      desc: t("rule_1_desc"),
    },
    {
      icon: Sparkles,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      title: t("rule_2_title"),
      desc: t("rule_2_desc"),
    },
    {
      icon: Globe,
      iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      title: t("rule_3_title"),
      desc: t("rule_3_desc"),
    },
    {
      icon: ShieldCheck,
      iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      title: t("rule_4_title"),
      desc: t("rule_4_desc"),
    },
  ];

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-5">
      <div className="flex items-center gap-2 text-primary font-bold text-lg">
        <HeartHandshake className="w-5 h-5" />
        <h2>{t("core_title")}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rules.map((rule, idx) => {
          const Icon = rule.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-2/60 border border-border/60 flex items-start gap-3.5 hover:border-primary/40 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${rule.iconClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm">
                  {rule.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
