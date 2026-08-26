"use client";

import * as React from "react";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Card hiển thị trạng thái gói dịch vụ trong trang Settings.
 * Tách riêng component theo quy chuẩn AGENTS.md §13.
 */
export function SubscriptionSettingsCard() {
  const t = useTranslations("pricing");
  const { isPro, state } = useEntitlements();

  return (
    <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>{t("title") || "Gói dịch vụ Pro"}</span>
        </h2>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
            isPro
              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
              : "bg-muted/15 text-muted border border-border"
          )}
        >
          {isPro ? t("plan.pro") : t("plan.free")}
        </span>
      </div>

      <p className="text-sm text-muted mb-4 leading-relaxed">
        {isPro
          ? t("current.pro_desc") || "Bạn đang sở hữu gói Pro với đầy đủ đặc quyền mở rộng bộ lọc & không giới hạn lượt tương tác."
          : t("nav.upgradeHint") || "Nâng cấp lên gói Pro để mở khóa bộ lọc đối tác nâng cao và nhận nhiều ưu đãi hơn."}
      </p>

      {state?.status === "canceling" && (
        <div className="mb-4 text-xs font-medium text-amber-600 bg-amber-500/10 p-3 rounded-xl flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Gói Pro của bạn sẽ hết hạn vào cuối chu kỳ thanh toán.</span>
        </div>
      )}

      <Link
        href="/pricing"
        className={cn(
          "inline-flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-xs",
          isPro
            ? "bg-surface-2 text-foreground hover:bg-border/60 border border-border"
            : "bg-primary text-white hover:bg-primary-hover"
        )}
      >
        <span>{isPro ? (t("current.manage") || "Quản lý gói dịch vụ") : (t("nav.upgrade") || "Nâng cấp ngay")}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
