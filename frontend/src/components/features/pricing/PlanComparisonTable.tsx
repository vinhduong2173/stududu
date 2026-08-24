"use client";

import { useTranslations } from "next-intl";
import {
  FEATURE_MESSAGE_KEY,
  PLAN_FEATURE_ORDER,
  type Entitlement,
  type EntitlementKey,
} from "@/lib/subscription";
import { PLAN_LIMITS, PlanFeatureRow } from "./PlanFeatureRow";

interface PlanComparisonTableProps {
  entitlements: Entitlement[];
}

/** US-37 AC1 — bảng hai cột Free/Pro với đủ 5 hạng mục ở SRS §3.2. */
export function PlanComparisonTable({ entitlements }: PlanComparisonTableProps) {
  const t = useTranslations("pricing");
  const byKey = new Map(entitlements.map((e) => [e.key, e]));

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5 md:p-6">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
              {t("table.feature")}
            </th>
            <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              {t("plan.free")}
            </th>
            <th className="py-3 pl-3 text-center text-xs font-semibold uppercase tracking-wide text-primary">
              {t("plan.pro")}
            </th>
          </tr>
        </thead>
        <tbody>
          {PLAN_FEATURE_ORDER.map((key) => {
            const slug = FEATURE_MESSAGE_KEY[key];
            return (
              <PlanFeatureRow
                key={key}
                featureKey={key}
                label={t(`features.${slug}.label` as never)}
                basis={t(`features.${slug}.basis` as never)}
                freeText={t(`features.${slug}.free` as never)}
                proText={t(`features.${slug}.pro` as never)}
                usageText={usageText(key, byKey.get(key), t)}
                entitlement={byKey.get(key)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** US-37 AC2 — dòng "Bạn đã dùng 27/30 hôm nay" ngay dưới tên hạng mục. */
function usageText(
  key: EntitlementKey,
  entitlement: Entitlement | undefined,
  t: ReturnType<typeof useTranslations>,
): string | undefined {
  if (!entitlement || entitlement.kind === "boolean") return undefined;

  const values = { used: entitlement.used, limit: PLAN_LIMITS[key][entitlement.plan] };
  return entitlement.kind === "cap"
    ? t("usage.total", values)
    : t("usage.today", values);
}
