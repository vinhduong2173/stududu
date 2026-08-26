"use client";

import * as React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Card hiển thị gói tài khoản cá nhân trên trang Hồ sơ (`/profile/me`).
 */
export function ProfileSubscriptionCard() {
  const t = useTranslations("pricing");
  const { isPro } = useEntitlements();

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>{t("title") || "Gói dịch vụ"}</span>
        </span>
        <span
          className={cn(
            "text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
            isPro
              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
              : "bg-muted/15 text-muted border border-border"
          )}
        >
          {isPro ? t("plan.pro") : t("plan.free")}
        </span>
      </h2>

      <p className="text-xs text-muted leading-relaxed mb-4">
        {isPro
          ? "Bạn đang sử dụng phiên bản Pro với mọi đặc quyền mở rộng."
          : "Tài khoản hiện tại: Miễn phí. Nâng cấp Pro để sử dụng tính năng lọc đối tác nâng cao."}
      </p>

      <Link
        href="/pricing"
        className="inline-flex items-center justify-between w-full text-xs font-semibold text-primary hover:underline bg-primary/5 hover:bg-primary/10 p-3 rounded-2xl border border-primary/20 transition-colors"
      >
        <span>{isPro ? "Chi tiết gói dịch vụ" : "Xem các gói & Nâng cấp Pro"}</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
