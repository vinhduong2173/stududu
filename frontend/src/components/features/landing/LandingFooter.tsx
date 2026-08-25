"use client";

import * as React from "react";
import { Logo } from "@/components/ui/Logo";
import { useTranslations } from "next-intl";

export function LandingFooter() {
  const t = useTranslations("home");

  return (
    <footer className="mt-auto border-t border-border bg-surface py-8 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo size="sm" showTagline={true} href="/" />
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} stududu. {t("footer_desc")}
        </p>
      </div>
    </footer>
  );
}
