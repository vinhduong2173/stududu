"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, BookOpen, Users, Volume2, Sparkles, Check } from "lucide-react";

export function KeyFeaturesSection() {
  const t = useTranslations("home");

  return (
    <section className="px-4 py-16 md:py-20 max-w-5xl mx-auto w-full">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
          {t("features_title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Feature 1: 1:1 Messaging & Voice Calls */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <MessageSquare className="w-5 h-5 text-teal-600 shrink-0" />
              <h3 className="font-bold text-base text-foreground font-display">
                {t("feature_chat_title")}
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-5">
              {t("feature_chat_desc")}
            </p>
          </div>
          
          {/* Natural Mini Preview */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs space-y-2 mt-auto">
            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-700 font-medium truncate">{t("feature_preview_voice_msg")}</span>
              <span className="text-teal-600 font-bold">{t("feature_preview_play")}</span>
            </div>
            <div className="text-[11px] text-slate-500 text-center font-medium">
              {t("feature_preview_voice_caption")}
            </div>
          </div>
        </div>

        {/* Feature 2: Instant Translation & Word Saving */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <BookOpen className="w-5 h-5 text-rose-500 shrink-0" />
              <h3 className="font-bold text-base text-foreground font-display">
                {t("feature_vocab_title")}
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-5">
              {t("feature_vocab_desc")}
            </p>
          </div>

          {/* Natural Mini Preview */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs space-y-1.5 mt-auto">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{t("feature_preview_word")}</span>
                <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">{t("feature_preview_saved")}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{t("feature_preview_definition")}</p>
            </div>
          </div>
        </div>

        {/* Feature 3: Community */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Users className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-bold text-base text-foreground font-display">
                {t("feature_community_title")}
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-5">
              {t("feature_community_desc")}
            </p>
          </div>

          {/* Natural Mini Preview */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs space-y-1.5 mt-auto">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                VN
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 text-xs truncate">{t("feature_preview_club_name")}</div>
                <div className="text-[10px] text-slate-500">{t("feature_preview_club_members")}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
