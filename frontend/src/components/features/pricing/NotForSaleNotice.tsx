"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const NOT_FOR_SALE = ["ranking", "badge", "calls", "messages", "safety"] as const;

/**
 * SRS §3.3 — "những thứ cố ý KHÔNG bán". Phần này quan trọng ngang phần bán gì:
 * nó là bằng chứng mô hình kinh doanh được thiết kế chứ không phải gắn thêm,
 * và là lá chắn cho USP no-credit (BR-38, BR-46).
 */
export function NotForSaleNotice() {
  const t = useTranslations("pricing.notForSale");

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-secondary" />
        <h2 className="text-base font-bold text-foreground">{t("title")}</h2>
      </div>
      <p className="mt-2 text-sm text-muted">{t("intro")}</p>

      <ul className="mt-4 space-y-3">
        {NOT_FOR_SALE.map((item) => (
          <li key={item} className="text-sm">
            <span className="font-semibold text-foreground">
              {t(`items.${item}.what` as never)}
            </span>
            <span className="text-muted"> — {t(`items.${item}.why` as never)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
