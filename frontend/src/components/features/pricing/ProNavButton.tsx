"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Lối vào gói Pro trên thanh điều hướng.
 *
 * Người đang dùng Free thấy lời mời nâng cấp; người đã có Pro thấy nhãn trạng
 * thái dẫn tới trang quản lý gói (US-37 AC3 — không mời nâng cấp nữa).
 *
 * Đây là chrome của ứng dụng, không phải hồ sơ công khai — SRS §3.3 chỉ cấm gắn
 * huy hiệu Pro lên hồ sơ để người khác nhìn thấy.
 */
export function ProNavButton({ className }: { className?: string }) {
  const t = useTranslations("pricing");
  const { isPro } = useEntitlements();

  return (
    <Link
      href="/pricing"
      title={isPro ? t("current.pro") : t("nav.upgradeHint")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-xs font-bold transition-colors",
        isPro
          ? "bg-primary/15 text-primary ring-1 ring-primary/25 hover:bg-primary/20"
          : "bg-primary text-white shadow-sm hover:bg-primary-hover",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {isPro ? t("plan.pro") : t("nav.upgrade")}
    </Link>
  );
}
