"use client";

import * as React from "react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Sparkles, ShieldCheck, HeartHandshake, Zap } from "lucide-react";

interface RegisterHeroColumnProps {
  t: any;
}

export function RegisterHeroColumn({ t }: RegisterHeroColumnProps) {
  const highlights = [
    {
      icon: HeartHandshake,
      title: t("register.hero_feature_1_title") || "100% Tương hỗ",
      desc: t("register.hero_feature_1_desc") || "Không cần mua credit hay trả phí",
    },
    {
      icon: Zap,
      title: t("register.hero_feature_2_title") || "Luyện phản xạ nhanh",
      desc: t("register.hero_feature_2_desc") || "Đàm thoại trực tiếp cùng người bản xứ",
    },
    {
      icon: ShieldCheck,
      title: t("register.hero_feature_3_title") || "Cộng đồng an toàn",
      desc: t("register.hero_feature_3_desc") || "Hệ thống kiểm duyệt & đánh giá tin cậy",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0D766E] p-12 text-white flex-col justify-between relative overflow-hidden">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

      {/* Top Logo */}
      <div className="relative">
        <Logo size="md" href="/" />
      </div>

      {/* Center Narrative & Highlights */}
      <div className="relative max-w-md my-auto space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("register.hero_badge") || "Tham gia cùng +10.000 người học"}</span>
        </div>

        <h1 className="text-3xl xl:text-4xl font-extrabold font-display leading-[1.15] tracking-tight text-white">
          {t("register.hero_title")}
        </h1>
        
        <p className="text-sm md:text-base text-teal-100/90 leading-relaxed font-normal">
          {t("register.hero_subtitle")}
        </p>

        {/* Community Proof Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <Avatar fallback="S" size="sm" className="ring-2 ring-white/40" />
              <Avatar fallback="E" size="sm" className="ring-2 ring-white/40" />
              <Avatar fallback="A" size="sm" className="ring-2 ring-white/40" />
            </div>
            <div className="text-xs text-white">
              <span className="font-bold block">{t("register.hero_community_card_title") || "Kết nối khắp thế giới"}</span>
              <span className="text-[10px] text-teal-200">{t("register.hero_community_card_desc") || "Anh · Nhật · Hàn · Pháp · Đức · Tây Ban Nha"}</span>
            </div>
          </div>
        </div>

        {/* 3 Core Highlights */}
        <div className="space-y-3 pt-1">
          {highlights.map(({ icon: Icon, title, desc }, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/15">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">{title}</div>
                <div className="text-[11px] text-teal-100/80">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Tagline */}
      <div className="relative text-xs text-teal-200/80 font-medium">
        © {new Date().getFullYear()} Stududu. Speak global, connect local.
      </div>
    </div>
  );
}
