"use client";

import * as React from "react";
import { Logo } from "@/components/ui/Logo";
import { Globe, MessageSquare, Users } from "lucide-react";

interface LoginHeroSectionProps {
  t: any;
}

export function LoginHeroSection({ t }: LoginHeroSectionProps) {
  const features = [
    { icon: Globe, text: t("login.hero_p1") },
    { icon: MessageSquare, text: t("login.hero_p2") },
    { icon: Users, text: t("login.hero_p3") },
  ];

  return (
    <aside className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-[#0D766E]">
      <div className="relative">
        <Logo size="md" href="/" variant="white" />
      </div>

      <div className="relative max-w-md my-auto">
        <h2 className="font-display text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
          {t("login.hero_title")}
        </h2>
        <p className="mt-4 text-teal-100/90 text-sm md:text-base leading-relaxed">
          {t("login.hero_sub")}
        </p>

        <div className="mt-8 space-y-3.5">
          {features.map(({ icon: Icon, text }, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-xs md:text-sm font-medium text-white">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative text-xs text-teal-200/80 font-medium">
        {t("login.hero_footer")}
      </div>
    </aside>
  );
}
