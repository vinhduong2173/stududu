"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingHeader } from "@/components/features/pricing/PricingHeader";
import { CurrentPlanCard } from "@/components/features/pricing/CurrentPlanCard";
import { PlanComparisonTable } from "@/components/features/pricing/PlanComparisonTable";
import { NotForSaleNotice } from "@/components/features/pricing/NotForSaleNotice";
import { CheckoutReturnNotice } from "@/components/features/pricing/CheckoutReturnNotice";

// US-37 — trang so sánh gói. Ráp các mảnh ghép, không chứa logic (AGENTS §13.2).
export default function PricingPage() {
  const t = useTranslations("pricing");
  const s = useSubscription();

  if (s.loading || !s.state) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-muted">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-4 pb-16 md:py-6">
      <PricingHeader />

      {/* Chờ webhook xác nhận sau khi quay về từ cổng thanh toán */}
      <React.Suspense fallback={null}>
        <CheckoutReturnNotice isPro={s.isPro} onRefresh={s.reload} />
      </React.Suspense>

      {s.error && (
        <p className="rounded-xl bg-error/5 px-4 py-3 text-sm text-error">{s.error}</p>
      )}

      <CurrentPlanCard
        state={s.state}
        isPro={s.isPro}
        busy={s.busy}
        onUpgrade={s.upgrade}
        onCancel={s.cancel}
        onResume={s.resume}
      />

      <PlanComparisonTable entitlements={s.state.entitlements} />
      <NotForSaleNotice />
    </div>
  );
}
