"use client";

import * as React from "react";
import { ArrowRight, BookOpen, MessageCircle, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function AboutCtaHub() {
  const t = useTranslations("about");

  const ctaItems = [
    {
      icon: Users,
      iconBg: "bg-primary/10 text-primary",
      title: t("cta_discover_title"),
      desc: t("cta_discover_desc"),
      btnText: t("cta_discover_btn"),
      href: "/discover",
      primary: true,
    },
    {
      icon: MessageCircle,
      iconBg: "bg-secondary/10 text-secondary",
      title: t("cta_community_title"),
      desc: t("cta_community_desc"),
      btnText: t("cta_community_btn"),
      href: "/community",
      primary: false,
    },
    {
      icon: BookOpen,
      iconBg: "bg-accent/10 text-accent",
      title: t("cta_vocabulary_title"),
      desc: t("cta_vocabulary_desc"),
      btnText: t("cta_vocabulary_btn"),
      href: "/vocabulary",
      primary: false,
    },
  ];

  return (
    <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
      <div className="text-center space-y-1.5 max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground font-display">
          {t("cta_title")}
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          {t("cta_subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ctaItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-surface-2/50 border border-border/70 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <Link
                href={item.href}
                className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
                  item.primary
                    ? "bg-primary text-white hover:bg-primary-hover shadow-xs"
                    : "bg-surface text-foreground border border-border hover:bg-surface-2"
                }`}
              >
                {item.btnText}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
