"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroChatPreview } from "./HeroChatPreview";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center text-left py-6 md:py-10">
      {/* LEFT COLUMN: Main copy & Actions */}
      <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
        {/* Live Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold mb-5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>{t("eyebrow")}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-foreground font-display tracking-tight leading-[1.12] mb-5">
          {t("title_part1")}{" "}
          <span className="text-[#0D766E] block sm:inline">
            {t("title_part2")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-muted mb-8 max-w-xl font-normal leading-relaxed">
          {t("description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-9">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm px-8 sd-btn-gradient font-bold rounded-full shadow-card gap-2.5 h-12 active:scale-[0.98] transition-all group"
            >
              <span>{t("get_started")}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-sm px-7 font-bold rounded-full bg-white border-slate-300 hover:bg-slate-50 h-12 text-foreground active:scale-[0.98] transition-all"
            >
              {t("login")}
            </Button>
          </Link>
        </div>

        {/* Social Proof & Trust Statement (BR-13 compliant: authentic, no fake ratings) */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center -space-x-2.5">
            <Avatar fallback="S" size="sm" className="ring-2 ring-white" />
            <Avatar fallback="K" size="sm" className="ring-2 ring-white" />
            <Avatar fallback="E" size="sm" className="ring-2 ring-white" />
            <Avatar fallback="Y" size="sm" className="ring-2 ring-white" />
          </div>
          <div className="text-xs font-semibold text-slate-700">
            {t("trust_badge")}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Tandem-Style Live Conversation Showcase */}
      <div className="lg:col-span-5 w-full">
        <HeroChatPreview />
      </div>
    </div>
  );
}
