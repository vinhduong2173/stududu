"use client";

import { Check, X } from "lucide-react";
import { ProBadge } from "@/components/ui/ProBadge";
import type { Entitlement, EntitlementKey } from "@/lib/subscription";

/** Hạn mức Free/Pro cố định theo SRS §3.2 — chỉ để hiển thị bảng so sánh. */
export const PLAN_LIMITS: Record<EntitlementKey, { free: number; pro: number }> = {
  "translate.lookup": { free: 30, pro: 500 },
  "vocabulary.save": { free: 100, pro: 2000 },
  "chat.image_upload": { free: 10, pro: 100 },
  "match.like": { free: 10, pro: 50 },
  "match.advanced_filter": { free: 0, pro: 1 },
};

interface PlanFeatureRowProps {
  featureKey: EntitlementKey;
  label: string;
  basis: string;
  freeText: string;
  proText: string;
  /** US-37 AC2 — "Bạn đã dùng 27/30 hôm nay". */
  usageText?: string;
  entitlement?: Entitlement;
}

export function PlanFeatureRow({
  featureKey,
  label,
  basis,
  freeText,
  proText,
  usageText,
  entitlement,
}: PlanFeatureRowProps) {
  const isBoolean = featureKey === "match.advanced_filter";

  return (
    <tr className="border-b border-border last:border-0 align-top">
      <td className="py-4 pr-4">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
          {label}
          {/* Chỉ hạng mục Pro-only mới đeo nhãn PRO; hạng mục có hạn mức thì
              không, vì gói Free vẫn dùng được (SRS §3.2). */}
          {isBoolean && <ProBadge locked={entitlement ? !entitlement.allowed : true} />}
        </p>
        <p className="mt-1 text-xs text-muted">{basis}</p>
        {usageText && (
          <p
            className={`mt-1.5 text-xs font-medium ${
              entitlement?.warn ? "text-error" : "text-primary"
            }`}
          >
            {usageText}
          </p>
        )}
      </td>
      <td className="py-4 px-3 text-center text-sm text-foreground">
        {isBoolean ? <X className="mx-auto h-5 w-5 text-muted" /> : freeText}
      </td>
      <td className="py-4 pl-3 text-center text-sm font-semibold text-primary">
        {isBoolean ? <Check className="mx-auto h-5 w-5 text-primary" /> : proText}
      </td>
    </tr>
  );
}
