"use client";

import { useTranslations } from "next-intl";

/**
 * SRS §2 — nguyên tắc thiết kế duy nhất của mô hình gói. Nói ra chủ động ngay
 * đầu trang là cách xử lý rủi ro R-05 (subscription bị hiểu là mâu thuẫn với
 * USP no-credit).
 */
export function PricingHeader() {
  const t = useTranslations("pricing");

  return (
    <header className="space-y-3">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        {t("title")}
      </h1>
      <blockquote className="rounded-2xl border-l-4 border-primary bg-primary/5 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {t("principle.line1")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("principle.line2")}</p>
      </blockquote>
    </header>
  );
}
