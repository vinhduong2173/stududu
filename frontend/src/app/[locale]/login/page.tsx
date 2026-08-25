"use client";

import * as React from "react";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useLogin } from "@/hooks/useLogin";
import { LoginHeroSection } from "@/components/features/auth/LoginHeroSection";
import { LoginFormFields } from "@/components/features/auth/LoginFormFields";
import { SocialLoginButtons } from "@/components/features/auth/SocialLoginButtons";
import { Logo } from "@/components/ui/Logo";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const l = useLogin();

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Cột trái — hero thương hiệu (desktop) */}
      <LoginHeroSection t={l.t} />

      {/* Cột phải — form đăng nhập */}
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          {/* Logo trên mobile */}
          <div className="lg:hidden mb-8 flex justify-start">
            <Logo size="sm" href="/" />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {l.t("login.title")}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted">{l.t("login.welcome")}</p>
          </div>

          {l.error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{l.error}</span>
            </div>
          )}

          <LoginFormFields
            t={l.t}
            email={l.email}
            setEmail={l.setEmail}
            password={l.password}
            setPassword={l.setPassword}
            remember={l.remember}
            setRemember={l.setRemember}
            loading={l.loading}
            handleLogin={l.handleLogin}
          />

          <SocialLoginButtons t={l.t} handleGoogleClick={l.handleGoogleClick} />
        </div>
      </main>
    </div>
  );
}
