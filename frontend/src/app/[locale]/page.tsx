"use client";

import * as React from "react";
import {
  LandingHeader,
  HeroSection,
  LanguagePickerSection,
  HowItWorksSection,
  KeyFeaturesSection,
  CtaBannerSection,
  LandingFooter,
} from "@/components/features/landing";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />

      {/* Hero Container */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-14 md:pb-16 max-w-6xl mx-auto w-full">
        <HeroSection />
      </section>

      {/* Language Picker Bar */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full pb-16">
        <LanguagePickerSection />
      </section>

      <HowItWorksSection />
      <KeyFeaturesSection />
      <CtaBannerSection />
      <LandingFooter />
    </div>
  );
}
