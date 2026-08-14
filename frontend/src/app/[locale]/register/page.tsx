"use client";

import * as React from "react";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useRegister } from "@/hooks/useRegister";
import { RegisterHeroColumn } from "@/components/features/auth/RegisterHeroColumn";
import { RegisterFormFields } from "@/components/features/auth/RegisterFormFields";
import { SocialRegisterButtons } from "@/components/features/auth/SocialRegisterButtons";

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
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">{r.t("register.title")}</h1>
            <p className="mt-1 text-muted text-sm">{r.t("register.subtitle")}</p>
          </div>

          {r.error && (
            <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">
              {r.error}
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
