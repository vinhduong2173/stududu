"use client";

import * as React from "react";
import { Stepper } from "@/components/ui/Stepper";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  OnboardingStep1Languages,
  OnboardingStep2Interests,
  OnboardingStep3Profile,
} from "@/components/features/onboarding";
import { AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const o = useOnboarding();

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 relative flex flex-col items-center justify-center text-foreground">
      {/* Top Bar: Logo & Language Switcher */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 px-1 relative z-30">
        <Logo size="md" href="/" />
        <div className="bg-white/80 backdrop-blur-sm rounded-full p-0.5 border border-border/70 shadow-2xs relative z-30">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="w-full max-w-2xl bg-surface p-6 sm:p-10 rounded-3xl shadow-card border border-border">
        <Stepper
          steps={[o.t("step_languages"), o.t("step_interests"), o.t("step_complete")]}
          currentStep={o.step}
          className="mb-8"
        />

        {o.error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/90 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium leading-relaxed">{o.error}</span>
          </div>
        )}

        {o.step === 1 && (
          <OnboardingStep1Languages
            t={o.t}
            tDisc={o.tDisc}
            locale={o.locale}
            availableLanguages={o.availableLanguages}
            myLanguages={o.myLanguages}
            teachLangId={o.teachLangId}
            setTeachLangId={o.setTeachLangId}
            teachRole={o.teachRole}
            setTeachRole={o.setTeachRole}
            learnLangId={o.learnLangId}
            setLearnLangId={o.setLearnLangId}
            learnLevel={o.learnLevel}
            setLearnLevel={o.setLearnLevel}
            getLangName={o.getLangName}
            handleAddTeach={o.handleAddTeach}
            handleAddLearn={o.handleAddLearn}
            handleRemoveLang={o.handleRemoveLang}
            submitStep1={o.submitStep1}
            loading={o.loading}
          />
        )}

        {o.step === 2 && (
          <OnboardingStep2Interests
            t={o.t}
            tRoot={o.tRoot}
            availableTopics={o.availableTopics}
            selectedTopics={o.selectedTopics}
            setSelectedTopics={o.setSelectedTopics}
            setStep={o.setStep}
            submitStep2={o.submitStep2}
            loading={o.loading}
          />
        )}

        {o.step === 3 && (
          <OnboardingStep3Profile
            t={o.t}
            tRoot={o.tRoot}
            country={o.country}
            setCountry={o.setCountry}
            city={o.city}
            setCity={o.setCity}
            intent={o.intent}
            setIntent={o.setIntent}
            bio={o.bio}
            setBio={o.setBio}
            setStep={o.setStep}
            submitStep3={o.submitStep3}
            loading={o.loading}
          />
        )}
      </div>
    </div>
  );
}
