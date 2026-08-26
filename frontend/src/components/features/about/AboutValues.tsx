"use client";

import * as React from "react";
import { Users, Heart, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function AboutValues() {
  const t = useTranslations("about");

  const values = [
    {
      icon: Users,
      iconClass: "bg-primary/10 text-primary",
      title: t("value_1_title"),
      desc: t("value_1_desc"),
    },
    {
      icon: Heart,
      iconClass: "bg-secondary/10 text-secondary",
      title: t("value_2_title"),
      desc: t("value_2_desc"),
    },
    {
      icon: Shield,
      iconClass: "bg-accent/10 text-accent",
      title: t("value_3_title"),
      desc: t("value_3_desc"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {values.map((v, idx) => {
        const Icon = v.icon;
        return (
          <div
            key={idx}
            className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-3 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${v.iconClass}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">{v.title}</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {v.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}
