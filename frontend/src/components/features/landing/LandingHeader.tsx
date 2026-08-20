"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";

export function LandingHeader() {
  const t = useTranslations("home");

  return (
    <header className="flex items-center justify-between px-6 md:px-12 py-3.5 sticky top-0 z-40 bg-white border-b border-border">
      <Logo size="md" showTagline={true} href="/" />
      <nav className="flex items-center gap-3">
        <LanguageSwitcher />
        <Link href="/login">
          <Button variant="ghost" size="sm" className="font-bold text-xs md:text-sm">
            {t("login")}
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="sd-btn-gradient font-bold shadow-xs text-xs md:text-sm rounded-full px-5">
            {t("register")}
          </Button>
        </Link>
      </nav>
    </header>
  );
}
