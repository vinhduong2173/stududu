"use client";

import * as React from "react";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useRegister } from "@/hooks/useRegister";
import { RegisterHeroColumn } from "@/components/features/auth/RegisterHeroColumn";
import { RegisterFormFields } from "@/components/features/auth/RegisterFormFields";
import { SocialRegisterButtons } from "@/components/features/auth/SocialRegisterButtons";
import { Logo } from "@/components/ui/Logo";
import { AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const r = useRegister();

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background text-foreground relative">
      {/* Brand Hero (Desktop) */}
      <RegisterHeroColumn t={r.t} />

      {/* Register Form Main */}
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
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
              {r.t("register.title")}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              {r.t("register.subtitle")}
            </p>
          </div>

          {r.error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/90 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{r.error}</span>
            </div>
          )}

          <RegisterFormFields
            t={r.t}
            firstName={r.firstName}
            setFirstName={r.setFirstName}
            lastName={r.lastName}
            setLastName={r.setLastName}
            country={r.country}
            handleCountryChange={r.handleCountryChange}
            city={r.city}
            setCity={r.setCity}
            intent={r.intent}
            setIntent={r.setIntent}
            day={r.day}
            setDay={r.setDay}
            month={r.month}
            setMonth={r.setMonth}
            year={r.year}
            setYear={r.setYear}
            gender={r.gender}
            setGender={r.setGender}
            email={r.email}
            setEmail={r.setEmail}
            password={r.password}
            setPassword={r.setPassword}
            saveDraft={r.saveDraft}
            handleRegister={r.handleRegister}
            loading={r.loading}
            isPending={r.isPending}
            days={r.days}
            months={r.months}
            years={r.years}
          />

          <SocialRegisterButtons t={r.t} handleGoogleClick={r.handleGoogleClick} />
        </div>
      </main>
    </div>
  );
}
