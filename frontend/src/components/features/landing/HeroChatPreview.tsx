"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import { Globe, BookmarkCheck, Play } from "lucide-react";

export function HeroChatPreview() {
  const t = useTranslations("home");

  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none">
      {/* Background Decorative Glow (Subtle & Natural) */}
      <div className="absolute -inset-1.5 bg-gradient-to-tr from-teal-500/10 via-teal-700/5 to-rose-500/10 rounded-3xl blur-xl -z-10 pointer-events-none" />

      <div className="relative bg-surface rounded-2xl border border-border shadow-card p-5 sm:p-6 space-y-4">
        {/* Tandem Partner Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
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

          <div className="flex items-center gap-1.5 bg-teal-50 text-teal-800 text-[11px] font-bold px-3 py-1 rounded-full border border-teal-200/80">
            <span>🇯🇵 ⇄ 🇬🇧</span>
            <span className="text-[10px] text-teal-600 font-medium">Tandem</span>
          </div>
        </div>

        {/* Live Conversation Stream */}
        <div className="space-y-3 pt-1 text-xs">
          {/* Yuki's Partner Message */}
          <div className="flex flex-col items-start space-y-1.5 max-w-[92%]">
            <div className="bg-slate-100/90 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs">
              <p className="font-medium text-[13px] leading-relaxed">
                {t("hero_chat_yuki_msg")}
              </p>
            </div>
            
            {/* Inline Translation Pill */}
            <div className="inline-flex items-center gap-1.5 text-[11px] text-teal-800 bg-teal-50/90 border border-teal-200/80 px-2.5 py-1 rounded-lg">
              <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{t("hero_chat_translation")}</span>
            </div>
          </div>

          {/* User's Audio Response */}
          <div className="flex flex-col items-end space-y-1.5 ml-auto max-w-[88%]">
            <div className="bg-teal-700 text-white rounded-2xl rounded-tr-xs px-4 py-3 w-full flex items-center justify-between gap-3 shadow-card">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Play sample voice note"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition-colors shrink-0"
                >
                  <Play className="w-3 h-3 fill-white text-white translate-x-[1px]" />
                </button>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold">{t("hero_chat_voice_msg")}</p>
                  {/* Waveform Visualization */}
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 h-2 bg-white/90 rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-white/90 rounded-full" />
                    <span className="w-0.5 h-1.5 bg-white/80 rounded-full" />
                    <span className="w-0.5 h-3.5 bg-white rounded-full" />
                    <span className="w-0.5 h-2 bg-white/90 rounded-full" />
                    <span className="w-0.5 h-2.5 bg-white rounded-full" />
                    <span className="w-0.5 h-1.5 bg-white/80 rounded-full" />
                  </div>
                </div>
              </div>
              <span className="text-[10px] opacity-80 font-medium tracking-tight">✓✓</span>
            </div>
          </div>
        </div>

        {/* Floating Vocabulary Capture Tooltip */}
        <div className="pt-1 flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-[11px]">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              木漏れ日
            </span>
            <span className="text-muted">{t("hero_chat_vocab_meaning")}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70">
            <BookmarkCheck className="w-3 h-3" />
            {t("hero_chat_vocab_saved")}
          </span>
        </div>
      </div>
    </div>
  );
}
