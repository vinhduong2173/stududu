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
    <div className="grid min-h-screen lg:grid-cols-2 bg-background text-foreground">
      {/* Left Column: Brand Hero (Desktop) */}
      <LoginHeroSection t={l.t} />

      {/* Right Column: Form Container */}
      <main className="relative flex items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
        <div className="absolute top-5 right-5 z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-full p-0.5 border border-border/70 shadow-2xs">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="w-full max-w-md py-6">
          {/* Logo on Mobile */}
          <div className="lg:hidden mb-8 flex justify-start">
            <Logo size="md" href="/" />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {l.t("login.title")}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              {l.t("login.welcome")}
            </p>
          </div>

          {l.error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/90 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{l.error}</span>
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
