"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Entitlement } from "@/lib/subscription";

/**
 * Chip mức dùng cho các hạng mục CÓ HẠN MỨC (quota/cap).
 *
 * Cố ý khác hẳn ProBadge: những chức năng này chạy được ở cả gói Free, chỉ khác
 * con số. Gắn nhãn PRO lên chúng sẽ nói sai rằng người dùng Free không được
 * dùng — trong khi SRS §3.2 nói rõ Free không bị cắt bớt chức năng nào.
 */
export function QuotaChip({
  entitlement,
  className,
}: {
  entitlement?: Entitlement;
  className?: string;
}) {
  const t = useTranslations("pricing.quota");
  if (!entitlement || entitlement.kind === "boolean") return null;

  const exhausted = !entitlement.allowed;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        exhausted
          ? "bg-error/10 text-error"
          : entitlement.warn
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-muted/15 text-muted",
        className,
      )}
      title={exhausted ? t("title") : undefined}
    >
      {entitlement.used}/{entitlement.limit}
    </span>
  );
}
