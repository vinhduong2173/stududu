"use client";

import * as React from "react";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useLogin } from "@/hooks/useLogin";
import { LoginHeroSection } from "@/components/features/auth/LoginHeroSection";
import { LoginFormFields } from "@/components/features/auth/LoginFormFields";
import { SocialLoginButtons } from "@/components/features/auth/SocialLoginButtons";

export default function LoginPage() {
  const l = useLogin();

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Cột trái — hero thương hiệu */}
      <LoginHeroSection t={l.t} />

      {/* Cột phải — form đăng nhập */}
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              {l.t("login.title")}
            </h1>
            <p className="mt-2 text-sm text-muted">{l.t("login.welcome")}</p>
          </div>

          {l.error && (
            <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">
              {l.error}
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
