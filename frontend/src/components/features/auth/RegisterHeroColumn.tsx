"use client";

import * as React from "react";
import { Logo } from "@/components/ui/Logo";

interface RegisterHeroColumnProps {
  t: any;
}

export function RegisterHeroColumn({ t }: RegisterHeroColumnProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0D766E] p-12 text-white flex-col justify-between relative overflow-hidden">
      <div className="relative">
        <Logo size="md" href="/" variant="white" />
      </div>

      <div className="relative max-w-md my-auto">
        <h1 className="text-3xl xl:text-4xl font-extrabold font-display leading-tight tracking-tight text-white mb-4">
          {t("register.hero_title")}
        </h1>
        <p className="text-sm md:text-base text-teal-100/90 leading-relaxed">
          {t("register.hero_subtitle")}
        </p>
      </div>

      <div className="relative text-xs text-teal-200/80 font-medium">
        © {new Date().getFullYear()} stududu. Speak global, connect local.
      </div>
    </div>
  );
}
