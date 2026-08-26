import * as React from "react";
import { LegalNavTabs } from "@/components/features/legal/LegalNavTabs";
import { AboutHeader } from "@/components/features/about/AboutHeader";
import { AboutValues } from "@/components/features/about/AboutValues";
import { AboutMissionFeatures } from "@/components/features/about/AboutMissionFeatures";
import { AboutCtaHub } from "@/components/features/about/AboutCtaHub";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <LegalNavTabs />
        <AboutHeader />
        <AboutValues />
        <AboutMissionFeatures />
        <AboutCtaHub />
      </div>
    </div>
  );
}
