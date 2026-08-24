"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";

export function HowItWorksSection() {
  const t = useTranslations("home");

  return (
    <section className="px-4 py-16 md:py-24 bg-slate-50/70 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
            {t("how_it_works_title")}
          </h2>
          <p className="text-muted text-sm md:text-base mt-2 max-w-xl mx-auto font-normal">
            {t("how_it_works_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Person 1: Stefania */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card flex flex-col items-center text-center">
            <Avatar fallback="S" size="xl" online={true} className="mb-3" />
            <h3 className="font-bold text-base text-foreground font-display">Stefania</h3>
            <p className="text-xs text-muted mt-0.5">{t("stefania_location")}</p>

            <div className="mt-5 grid grid-cols-2 gap-2 w-full text-xs">
              {/* Speaks */}
              <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {t("speaks_label")}
                </span>
                <span className="text-2xl mb-1">🇩🇪</span>
                <span className="font-bold text-foreground text-xs">{t("stefania_speaks").replace("🇩🇪", "").trim()}</span>
                <span className="text-[10px] text-teal-800 font-semibold mt-0.5">({t("stefania_speaks_level")})</span>
              </div>

              {/* Learns */}
              <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {t("learns_label")}
                </span>
                <span className="text-2xl mb-1">🇬🇧</span>
                <span className="font-bold text-foreground text-xs">{t("stefania_learns").replace("🇬🇧", "").trim()}</span>
                <span className="text-[10px] text-rose-700 font-semibold mt-0.5">({t("stefania_learns_level")})</span>
              </div>
            </div>
          </div>

          {/* Exchange Connection in Center */}
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-card mb-3">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-teal-900 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              {t("exchange_badge")}
            </span>
            <p className="text-xs text-muted mt-2.5 max-w-[220px] leading-relaxed font-normal">
              {t("exchange_desc")}
            </p>
          </div>

          {/* Person 2: Anne */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card flex flex-col items-center text-center">
            <Avatar fallback="A" size="xl" online={true} className="mb-3" />
            <h3 className="font-bold text-base text-foreground font-display">Anne</h3>
            <p className="text-xs text-muted mt-0.5">{t("anne_location")}</p>

            <div className="mt-5 grid grid-cols-2 gap-2 w-full text-xs">
              {/* Speaks */}
              <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {t("speaks_label")}
                </span>
                <span className="text-2xl mb-1">🇬🇧</span>
                <span className="font-bold text-foreground text-xs">{t("anne_speaks").replace("🇬🇧", "").trim()}</span>
                <span className="text-[10px] text-teal-800 font-semibold mt-0.5">({t("anne_speaks_level")})</span>
              </div>

              {/* Learns */}
              <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {t("learns_label")}
                </span>
                <span className="text-2xl mb-1">🇩🇪</span>
                <span className="font-bold text-foreground text-xs">{t("anne_learns").replace("🇩🇪", "").trim()}</span>
                <span className="text-[10px] text-rose-700 font-semibold mt-0.5">({t("anne_learns_level")})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
