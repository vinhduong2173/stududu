"use client";

import * as React from "react";

interface LoginHeroSectionProps {
  t: any;
}

export function LoginHeroSection({ t }: LoginHeroSectionProps) {
  return (
    <aside className="sd-cover relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white">
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative font-display text-2xl font-extrabold tracking-tight">stududu</div>

      <div className="relative max-w-md">
        <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
          {t("login.hero_title")}
        </h2>
        <p className="mt-4 text-white/75 leading-relaxed">{t("login.hero_sub")}</p>

        <div className="mt-10 space-y-4">
          {[
            ["🌍", t("login.hero_p1")],
            ["💬", t("login.hero_p2")],
            ["🤝", t("login.hero_p3")],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
                {icon}
              </span>
              <span className="text-sm text-white/90">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative text-xs text-white/50">{t("login.hero_footer")}</div>
    </aside>
  );
}
