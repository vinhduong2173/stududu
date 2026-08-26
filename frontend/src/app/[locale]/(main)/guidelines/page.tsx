import * as React from "react";
import { LegalNavTabs } from "@/components/features/legal/LegalNavTabs";
import { GuidelinesHeader } from "@/components/features/guidelines/GuidelinesHeader";
import { GuidelinesCoreRules } from "@/components/features/guidelines/GuidelinesCoreRules";
import { GuidelinesProhibited } from "@/components/features/guidelines/GuidelinesProhibited";
import { GuidelinesSafety } from "@/components/features/guidelines/GuidelinesSafety";

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <LegalNavTabs />
        <GuidelinesHeader />
        <GuidelinesCoreRules />
        <GuidelinesProhibited />
        <GuidelinesSafety />
      </div>
    </div>
  );
}
