"use client";

import * as React from "react";

interface RegisterHeroColumnProps {
  t: any;
}

export function RegisterHeroColumn({ t }: RegisterHeroColumnProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 text-white flex-col justify-center">
      <h1 className="text-5xl font-bold mb-6">{t("register.hero_title")}</h1>
      <p className="text-xl opacity-90">{t("register.hero_subtitle")}</p>
    </div>
  );
}
