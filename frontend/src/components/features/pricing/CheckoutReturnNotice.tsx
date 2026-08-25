"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 6;

/**
 * Stripe đưa người dùng về `/pricing?checkout=success` NGAY sau khi trả tiền,
 * nhưng quyền Pro chỉ bật khi webhook `checkout.session.completed` tới — thường
 * chậm hơn một vài giây. Không có màn chờ này thì người vừa trả tiền quay lại
 * thấy chữ "Free" và tưởng mình mất tiền.
 */
export function CheckoutReturnNotice({
  isPro,
  onRefresh,
}: {
  isPro: boolean;
  onRefresh: () => Promise<unknown>;
}) {
  const t = useTranslations("pricing.checkout");
  const outcome = useSearchParams().get("checkout");
  const [polls, setPolls] = React.useState(0);

  const waiting = outcome === "success" && !isPro && polls < MAX_POLLS;

  React.useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      void onRefresh().finally(() => setPolls((n) => n + 1));
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [waiting, polls, onRefresh]);

  if (outcome === "cancel") {
    return <Notice tone="muted">{t("canceled")}</Notice>;
  }
  if (outcome !== "success") return null;

  if (isPro) {
    return (
      <Notice tone="success">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {t("activated")}
      </Notice>
    );
  }

  return (
    <Notice tone="muted">
      {waiting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
      {waiting ? t("confirming") : t("confirmingSlow")}
    </Notice>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "success" | "muted";
  children: React.ReactNode;
}) {
  return (
    <p
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
        tone === "success"
          ? "bg-success/10 text-success"
          : "bg-muted/10 text-muted"
      }`}
    >
      {children}
    </p>
  );
}
