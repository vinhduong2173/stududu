import * as React from "react";
import { LegalNavTabs } from "@/components/features/legal/LegalNavTabs";
import { TermsHeader } from "@/components/features/terms/TermsHeader";
import { TermsScope } from "@/components/features/terms/TermsScope";
import { TermsSecurity } from "@/components/features/terms/TermsSecurity";
import { TermsProhibited } from "@/components/features/terms/TermsProhibited";
import { TermsModeration } from "@/components/features/terms/TermsModeration";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <LegalNavTabs />
        <TermsHeader />
        <TermsScope />
        <TermsSecurity />
        <TermsProhibited />
        <TermsModeration />
      </div>
    </div>
  );
}
