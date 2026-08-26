"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { TandemMatchIllustration } from "./TandemMatchIllustration";

export function HowItWorksSection() {
  const t = useTranslations("home");

  return (
    <section id="how-it-works" className="px-4 py-16 md:py-24 bg-slate-50/70 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
            {t("how_it_works_title")}
          </h2>
          <p className="text-muted text-sm md:text-base mt-2.5 max-w-xl mx-auto font-normal leading-relaxed">
            {t("how_it_works_subtitle")}
          </p>
        </div>

        <TandemMatchIllustration />
      </div>
    </section>
  );
}
