"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MockCheckoutForm } from "@/components/features/pricing/MockCheckoutForm";
import { PRO_MONTHLY_PRICE_VND } from "@/lib/subscription";

/**
 * US-38 — trang nhập thẻ của MockProvider (R-01). Với Stripe test mode, người
 * dùng được chuyển thẳng sang Checkout của Stripe và trang này không được dùng.
 */
export default function CheckoutPage() {
  return (
    <React.Suspense fallback={null}>
      <CheckoutContent />
    </React.Suspense>
  );
}

function CheckoutContent() {
  const t = useTranslations("pricing.checkout");
  const sessionId = useSearchParams().get("session");

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6 pb-16">
      <header>
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      {sessionId ? (
        <MockCheckoutForm sessionId={sessionId} amount={PRO_MONTHLY_PRICE_VND} />
      ) : (
        <p className="rounded-xl bg-error/5 px-4 py-3 text-sm text-error">
          {t("missingSession")}
        </p>
      )}
    </div>
  );
}
