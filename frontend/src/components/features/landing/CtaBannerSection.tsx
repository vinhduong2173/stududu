"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaBannerSection() {
  const t = useTranslations("home");

  return (
    <section className="px-4 py-12 max-w-6xl mx-auto w-full mb-16">
      <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 bg-[#0D766E] text-white overflow-hidden shadow-elevated text-center flex flex-col items-center">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

        <div className="relative inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold mb-4 border border-white/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tandem Language Exchange</span>
        </div>

        <h2 className="relative text-2xl sm:text-4xl md:text-5xl font-extrabold font-display tracking-tight max-w-2xl leading-[1.15]">
          {t("cta_title")}
        </h2>

        <p className="relative text-teal-100 text-sm sm:text-base max-w-lg mt-3.5 mb-8 font-normal leading-relaxed">
          {t("cta_subtitle")}
        </p>

        <Link href="/register" className="relative group">
          <Button
            size="lg"
            className="bg-white text-teal-950 hover:bg-slate-50 font-bold px-8 text-sm sm:text-base rounded-full shadow-card h-12 gap-2 active:scale-[0.98] transition-all"
          >
            <span>{t("cta_button")}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
