"use client";

import * as React from "react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Globe, MessageSquare, HeartHandshake, Sparkles } from "lucide-react";

interface LoginHeroSectionProps {
  t: any;
}

export function LoginHeroSection({ t }: LoginHeroSectionProps) {
  const features = [
    { icon: Globe, text: t("login.hero_p1") },
    { icon: MessageSquare, text: t("login.hero_p2") },
    { icon: HeartHandshake, text: t("login.hero_p3") },
  ];

  return (
    <aside className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-[#0D766E] overflow-hidden">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

      {/* Top Logo */}
      <div className="relative">
        <Logo size="md" href="/" />
      </div>

      {/* Center Value Proposition & Live Partner Preview */}
      <div className="relative max-w-md my-auto space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tandem Exchange Community</span>
        </div>

        <h2 className="font-display text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight text-white">
          {t("login.hero_title")}
        </h2>

        <p className="text-teal-100/90 text-sm md:text-base leading-relaxed font-normal">
          {t("login.hero_sub")}
        </p>

        {/* Live Tandem Preview Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar fallback="K" size="sm" online={true} className="ring-2 ring-white/30" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Kenjiro</span>
                  <span>🇯🇵</span>
                </div>
                <div className="text-[10px] text-teal-200">Tokyo · Online</div>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
              🇯🇵 ⇄ 🇻🇳
            </span>
          </div>
          <p className="text-xs text-white/90 font-medium bg-black/10 rounded-xl px-3 py-2">
            &ldquo;Luyện nói 15p tiếng Nhật & 15p tiếng Việt mỗi ngày nhé!&rdquo;
          </p>
        </div>

        {/* Value Prop Features */}
        <div className="space-y-2.5 pt-2">
          {features.map(({ icon: Icon, text }, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/15">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs md:text-sm font-medium text-white">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Tagline */}
      <div className="relative text-xs text-teal-200/80 font-medium">
        {t("login.hero_footer")}
      </div>
    </aside>
  );
}
