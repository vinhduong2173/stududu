"use client";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Link } from "@/i18n/routing";
import { PRO_MONTHLY_PRICE_VND, formatPrice } from "@/lib/subscription";

/**
 * Lối vào gói Pro trên trang hồ sơ của chính mình.
 *
 * Cần thiết vì thanh header là `hidden md:flex` — trên điện thoại không có
 * header, nên nút Pro ở đó không với tới được. Tab Hồ sơ thì luôn có ở thanh
 * dưới, đây là đường đi duy nhất tới /pricing khi dùng mobile.
 */
export function ProPlanCard() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const { isPro } = useEntitlements();

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
        <Sparkles className="h-5 w-5 text-primary" />
        {isPro ? t("current.pro") : t("current.free")}
      </h2>

      <p className="text-sm text-muted">
        {isPro
          ? t("nav.manageHint")
          : t("current.priceNote", {
              price: formatPrice(PRO_MONTHLY_PRICE_VND, locale),
            })}
      </p>

      <Button asChild variant={isPro ? "ghost" : "default"} size="sm" className="mt-4 rounded-xl">
        <Link href="/pricing">{isPro ? t("nav.manage") : t("nav.upgrade")}</Link>
      </Button>
    </div>
  );
}
