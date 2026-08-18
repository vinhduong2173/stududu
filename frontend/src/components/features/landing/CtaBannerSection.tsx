"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export function CtaBannerSection() {
  const t = useTranslations("home");

  return (
    <section className="px-4 py-10 max-w-5xl mx-auto w-full mb-12">
      <div className="relative rounded-2xl p-8 sm:p-10 md:p-12 bg-[#0D766E] text-white overflow-hidden shadow-card text-center flex flex-col items-center">
        <h2 className="relative text-2xl sm:text-3xl font-extrabold font-display tracking-tight max-w-xl leading-tight">
          {t("cta_title")}
        </h2>
        <p className="relative text-teal-100 text-sm max-w-lg mt-2 mb-6 font-normal">
          {t("cta_subtitle")}
        </p>

        <Link href="/register" className="relative">
          <Button size="lg" className="bg-white text-teal-900 hover:bg-slate-100 font-bold px-7 text-sm rounded-full shadow-xs h-11">
            {t("cta_button")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
