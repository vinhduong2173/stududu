"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, BookOpen, Users, Sparkles, Volume2, ShieldCheck, HeartHandshake } from "lucide-react";

export function KeyFeaturesSection() {
  const t = useTranslations("home");

  return (
    <section id="features" className="px-4 py-16 md:py-24 max-w-6xl mx-auto w-full">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-3 border border-teal-200/60">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Stududu Experience</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
          {t("features_title")}
        </h2>
      </div>

      {/* Asymmetric Bento Grid (Taste Skill standard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {/* Cell 1: 1:1 Live Text & Voice Exchange (Span 2 cols on md+) */}
        <div className="md:col-span-2 bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground font-display">
                  {t("feature_chat_title")}
                </h3>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                  Realtime Socket.IO
                </span>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-6 max-w-lg">
              {t("feature_chat_desc")}
            </p>
          </div>

          {/* Interactive Voice Player Mockup */}
          <div className="bg-surface-2/90 rounded-2xl p-4 border border-border/80 space-y-2.5">
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs shadow-2xs">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{t("feature_preview_voice_msg")}</div>
                  <div className="text-[10px] text-muted">{t("feature_preview_voice_caption")}</div>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/70">
                {t("feature_preview_play")}
              </span>
            </div>
          </div>
        </div>

        {/* Cell 2: Instant Vocabulary Capture & Notebook */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground font-display">
                {t("feature_vocab_title")}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
              {t("feature_vocab_desc")}
            </p>
          </div>

          {/* Vocabulary Card Preview */}
          <div className="bg-surface-2/90 p-3.5 rounded-2xl border border-border/80 space-y-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{t("feature_preview_word")}</span>
                <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold border border-rose-200/70">
                  {t("feature_preview_saved")}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-normal">
                {t("feature_preview_definition")}
              </p>
            </div>
          </div>
        </div>

        {/* Cell 3: 100% Mutual Exchange (No Points / No Credit System) */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground font-display">
                {t("exchange_badge")}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
              {t("exchange_desc")}
            </p>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70 flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{t("exchange_promise")}</span>
          </div>
        </div>

        {/* Cell 4: Language Learning Community (Span 2 cols on md+) */}
        <div className="md:col-span-2 bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground font-display">
                  {t("feature_community_title")}
                </h3>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                  Global Hubs
                </span>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-6 max-w-lg">
              {t("feature_community_desc")}
            </p>
          </div>

          {/* Mini Community Club Preview */}
          <div className="bg-surface-2/90 rounded-2xl p-3.5 border border-border/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                ENG
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">{t("feature_preview_club_name")}</div>
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t("feature_preview_club_members")}</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              {t("feature_preview_join")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
