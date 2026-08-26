"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/Logo";
import { useTranslations } from "next-intl";

export function LandingFooter() {
  const t = useTranslations("home");

  return (
    <footer className="mt-auto border-t border-border bg-white py-12 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Logo size="sm" showTagline={true} href="/" />
          <p className="text-xs text-muted max-w-sm text-center md:text-left mt-1">
            {t("footer_desc")}
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-muted">
          <Link href="/discover" className="hover:text-primary transition-colors">
            {t("eyebrow")}
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            {t("footer_terms")}
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            {t("footer_privacy")}
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-muted text-center md:text-right">
          © {new Date().getFullYear()} Stududu. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
