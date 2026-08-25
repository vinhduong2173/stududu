"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { formatPrice, type SubscriptionState } from "@/lib/subscription";

interface CurrentPlanCardProps {
  state: SubscriptionState;
  isPro: boolean;
  busy: boolean;
  onUpgrade: () => void;
  onCancel: () => void;
  onResume: () => void;
}

/**
 * US-37 AC3 — Pro không thấy lời mời nâng cấp, thay bằng "Bạn đang dùng Pro"
 * và nút quản lý gói. US-42 AC1 — `canceling` hiện rõ ngày còn hiệu lực.
 */
export function CurrentPlanCard({
  state,
  isPro,
  busy,
  onUpgrade,
  onCancel,
  onResume,
}: CurrentPlanCardProps) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const until = state.currentPeriodEnd
    ? new Date(state.currentPeriodEnd).toLocaleDateString(locale)
    : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t("current.title")}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">
        {isPro ? t("current.pro") : t("current.free")}
      </p>
      <p className="mt-1 text-sm text-muted">{t(`status.${state.status}` as never)}</p>

      {state.status === "past_due" && state.graceEndsAt && (
        // BR-41 — trong grace period vẫn còn nguyên quyền Pro.
        <p className="mt-3 rounded-xl bg-error/5 px-3 py-2 text-sm text-error">
          {t("current.grace", {
            date: new Date(state.graceEndsAt).toLocaleDateString(locale),
          })}
        </p>
      )}

      {state.status === "canceling" && until && (
        <p className="mt-3 rounded-xl bg-muted/10 px-3 py-2 text-sm text-foreground">
          {t("current.canceling", { date: until })}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!isPro && (
          <Button onClick={onUpgrade} disabled={busy}>
            {t("cta.upgrade", { price: formatPrice(state.price.amount, locale) })}
          </Button>
        )}
        {state.status === "active" && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t("cta.cancel")}
          </Button>
        )}
        {state.status === "canceling" && (
          <Button onClick={onResume} disabled={busy}>
            {t("cta.resume")}
          </Button>
        )}
      </div>

      {!isPro && (
        <p className="mt-3 text-xs text-muted">
          {t("current.priceNote", {
            price: formatPrice(state.price.amount, locale),
          })}
        </p>
      )}
    </div>
  );
}
