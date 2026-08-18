"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import { ArrowRight, Globe } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center text-left py-4 md:py-8">
      {/* LEFT COLUMN: Main copy & Actions */}
      <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold text-foreground font-display tracking-tight leading-[1.15] mb-5">
          {t("title_part1")}{" "}
          <span className="text-teal-700 block sm:inline">
            {t("title_part2")}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted mb-8 max-w-xl font-normal leading-relaxed">
          {t("description")}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-8">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-sm px-8 sd-btn-gradient font-bold rounded-full shadow-card gap-2.5 h-12 hover:scale-102 transition-all">
              <span>{t("get_started")}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm px-7 font-bold rounded-full bg-white border-slate-300 hover:bg-slate-50 h-12 text-foreground hover:scale-102 transition-all">
              {t("login")}
            </Button>
          </Link>
        </div>

        {/* Social Proof & Trust */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center -space-x-2.5">
            <Avatar fallback="S" size="sm" className="ring-2 ring-white" />
            <Avatar fallback="K" size="sm" className="ring-2 ring-white" />
            <Avatar fallback="E" size="sm" className="ring-2 ring-white" />
            <Avatar fallback="A" size="sm" className="ring-2 ring-white" />
          </div>
          <div className="text-xs font-semibold text-slate-700">
            {t("trust_badge")}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Tandem-Style Live Conversation Showcase */}
      <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
        <div className="relative bg-surface rounded-2xl border border-border shadow-card p-5 sm:p-6 space-y-4">
          {/* Partner Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-3">
              <Avatar fallback="Y" size="md" online={true} />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-foreground font-display">Yuki Sato</h3>
                  <span className="text-xs">🇯🇵</span>
                </div>
                <p className="text-[11px] text-muted flex items-center gap-1">
                  <span>Tokyo, Japan</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">Online</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-teal-50 text-teal-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-teal-200/70">
              <span>🇯🇵 ⇄ 🇬🇧</span>
            </div>
          </div>

          {/* Chat Exchange Stream */}
          <div className="space-y-3 pt-1 text-xs">
            {/* Yuki's Message */}
            <div className="flex flex-col items-start space-y-1 max-w-[90%]">
              <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-xs px-3.5 py-2.5">
                <p className="font-medium">{t("hero_chat_yuki_msg")}</p>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                <Globe className="w-3 h-3" />
                <span>{t("hero_chat_translation")}</span>
              </div>
            </div>

            {/* My Voice Message Response */}
            <div className="flex flex-col items-end space-y-1 ml-auto max-w-[85%]">
              <div className="bg-teal-700 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 w-full flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    ▶
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold">{t("hero_chat_voice_msg")}</p>
                    <div className="flex items-center gap-0.5 h-2">
                      <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                      <span className="w-0.5 h-3 bg-white rounded-full" />
                      <span className="w-0.5 h-1.5 bg-white rounded-full" />
                      <span className="w-0.5 h-3.5 bg-white rounded-full" />
                      <span className="w-0.5 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] opacity-80 font-medium">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
