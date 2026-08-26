import * as React from "react";
import { LegalNavTabs } from "@/components/features/legal/LegalNavTabs";
import { PrivacyHeader } from "@/components/features/privacy/PrivacyHeader";
import { PrivacyCollectedData } from "@/components/features/privacy/PrivacyCollectedData";
import { PrivacyNoSelling } from "@/components/features/privacy/PrivacyNoSelling";
import { PrivacyCommunications } from "@/components/features/privacy/PrivacyCommunications";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <LegalNavTabs />
        <PrivacyHeader />
        <PrivacyCollectedData />
        <PrivacyNoSelling />
        <PrivacyCommunications />
      </div>
    </div>
  );
}
