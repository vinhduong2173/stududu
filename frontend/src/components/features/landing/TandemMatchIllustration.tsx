"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";

export function TandemMatchIllustration() {
  const t = useTranslations("home");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      {/* Partner 1: Stefania */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-card flex flex-col items-center text-center">
        <Avatar fallback="S" size="xl" online={true} className="mb-3" />
        <h3 className="font-bold text-base text-foreground font-display">Stefania</h3>
        <p className="text-xs text-muted mt-0.5">{t("stefania_location")}</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 w-full text-xs">
          <div className="bg-surface-2/80 border border-slate-200/90 p-2.5 rounded-xl flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t("speaks_label")}</span>
            <span className="text-xl mb-0.5">🇩🇪</span>
            <span className="font-bold text-foreground text-xs">{t("stefania_speaks").replace("🇩🇪", "").trim()}</span>
            <span className="text-[10px] text-teal-800 font-semibold mt-0.5">({t("stefania_speaks_level")})</span>
          </div>

          <div className="bg-surface-2/80 border border-slate-200/90 p-2.5 rounded-xl flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t("learns_label")}</span>
            <span className="text-xl mb-0.5">🇬🇧</span>
            <span className="font-bold text-foreground text-xs">{t("stefania_learns").replace("🇬🇧", "").trim()}</span>
            <span className="text-[10px] text-rose-700 font-semibold mt-0.5">({t("stefania_learns_level")})</span>
          </div>
        </div>
      </div>

      {/* Center Tandem Connection Node */}
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="w-13 h-13 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-card mb-3 animate-bounce-short">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-teal-900 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200 shadow-2xs">
          {t("exchange_badge")}
        </span>
        <p className="text-xs text-muted mt-2.5 max-w-[220px] leading-relaxed font-normal">
          {t("exchange_desc")}
        </p>
      </div>

      {/* Partner 2: Anne */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-card flex flex-col items-center text-center">
        <Avatar fallback="A" size="xl" online={true} className="mb-3" />
        <h3 className="font-bold text-base text-foreground font-display">Anne</h3>
        <p className="text-xs text-muted mt-0.5">{t("anne_location")}</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 w-full text-xs">
          <div className="bg-surface-2/80 border border-slate-200/90 p-2.5 rounded-xl flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t("speaks_label")}</span>
            <span className="text-xl mb-0.5">🇬🇧</span>
            <span className="font-bold text-foreground text-xs">{t("anne_speaks").replace("🇬🇧", "").trim()}</span>
            <span className="text-[10px] text-teal-800 font-semibold mt-0.5">({t("anne_speaks_level")})</span>
          </div>

          <div className="bg-surface-2/80 border border-slate-200/90 p-2.5 rounded-xl flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t("learns_label")}</span>
            <span className="text-xl mb-0.5">🇩🇪</span>
            <span className="font-bold text-foreground text-xs">{t("anne_learns").replace("🇩🇪", "").trim()}</span>
            <span className="text-[10px] text-rose-700 font-semibold mt-0.5">({t("anne_learns_level")})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
