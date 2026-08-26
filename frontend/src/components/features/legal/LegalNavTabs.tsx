"use client";

import * as React from "react";
import { ArrowLeft, Globe, ShieldCheck, FileText, Lock } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function LegalNavTabs() {
  const t = useTranslations("legal_nav");
  const pathname = usePathname();

  const navTabs = [
    { href: "/about", label: t("tab_about"), icon: Globe },
    { href: "/guidelines", label: t("tab_guidelines"), icon: ShieldCheck },
    { href: "/terms", label: t("tab_terms"), icon: FileText },
    { href: "/privacy", label: t("tab_privacy"), icon: Lock },
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/community"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t("back_community")}
      </Link>

      <div className="flex items-center gap-1.5 p-1.5 bg-surface-2/70 border border-border/80 rounded-2xl overflow-x-auto no-scrollbar shadow-2xs">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-surface text-primary shadow-xs border border-border/60"
                  : "text-muted hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted"}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
