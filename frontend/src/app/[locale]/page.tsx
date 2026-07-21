"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  const router = useRouter();
  const t = useTranslations();

  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      router.push("/discover");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-6">
        <Logo size="md" showTagline={true} href="/" />
        <nav className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost">{t("home.login")}</Button>
          </Link>
          <Link href="/register">
            <Button>{t("home.register")}</Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 max-w-4xl tracking-tight">
          {t("home.title_part1")} <br className="hidden md:block"/> 
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("home.title_part2")}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl">
          {t("home.description")}
        </p>
        <div className="flex gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">{t("home.get_started")}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">{t("home.login")}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
