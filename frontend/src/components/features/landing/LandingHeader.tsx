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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 lg:px-12 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo size="md" showTagline={true} href="/" />

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted">
          <a href="#languages" className="hover:text-primary transition-colors">
            {t("practice_title").replace("...", "")}
          </a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">
            {t("how_it_works_title").replace("?", "")}
          </a>
          <a href="#features" className="hover:text-primary transition-colors">
            {t("features_title").split(" ")[0]}
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-bold text-xs sm:text-sm px-3">
              {t("login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="sd-btn-gradient font-bold shadow-xs text-xs sm:text-sm rounded-full px-4 sm:px-5">
              {t("register")}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
