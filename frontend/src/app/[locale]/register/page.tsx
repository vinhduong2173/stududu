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
    <div className="flex min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Cột minh hoạ (chỉ hiện trên desktop) */}
      <RegisterHeroColumn t={r.t} />

      {/* Cột form đăng ký */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Logo trên mobile */}
          <div className="lg:hidden mb-6 flex justify-start">
            <Logo size="sm" href="/" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
              {r.t("register.title")}
            </h1>
            <p className="mt-1 text-muted text-xs sm:text-sm">
              {r.t("register.subtitle")}
            </p>
          </div>

          {r.error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{r.error}</span>
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
      </div>
    </div>
  );
}
