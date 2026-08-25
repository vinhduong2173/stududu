"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { asQuotaError, type QuotaErrorBody } from "@/lib/api";

/**
 * US-39 AC1 — chạm hạn mức: nêu rõ hạn mức, thời điểm reset và một nút dẫn tới
 * /pricing. Dùng chung cho mọi màn hình có thao tác bị tính hạn mức.
 */
export function QuotaExceededDialog({
  quota,
  onClose,
}: {
  quota: QuotaErrorBody | null;
  onClose: () => void;
}) {
  const t = useTranslations("pricing.quota");
  const locale = useLocale();
  if (!quota) return null;

  const resetAt = quota.resetAt
    ? new Date(quota.resetAt).toLocaleString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-error" />
          <h3 className="text-base font-bold text-foreground">{t("title")}</h3>
        </div>

        <p className="mt-3 text-sm text-muted">
          {t("body", { limit: quota.limit })}
        </p>
        {resetAt && (
          <p className="mt-1 text-sm text-muted">{t("resetAt", { time: resetAt })}</p>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {t("dismiss")}
          </Button>
          <Button asChild className="flex-1">
            <Link href="/pricing">{t("seePlans")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Bắt lỗi 403 QUOTA_EXCEEDED từ bất kỳ lời gọi API nào và mở hộp thoại trên. */
export function useQuotaGuard() {
  const [quota, setQuota] = React.useState<QuotaErrorBody | null>(null);

  const capture = React.useCallback((err: unknown): boolean => {
    const parsed = asQuotaError(err);
    if (parsed) setQuota(parsed);
    return Boolean(parsed);
  }, []);

  return {
    capture,
    dialog: <QuotaExceededDialog quota={quota} onClose={() => setQuota(null)} />,
  };
}
