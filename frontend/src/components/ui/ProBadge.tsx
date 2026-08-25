"use client";

import { Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Nhãn PRO đặt cạnh CHỨC NĂNG thuộc gói Pro.
 *
 * Phạm vi dùng — quan trọng, đừng mở rộng: nhãn này chỉ gắn cho chức năng trong
 * giao diện. SRS §3.3 cấm huy hiệu Pro trên HỒ SƠ CÔNG KHAI của người dùng, vì
 * nó tạo phân tầng xã hội trong cộng đồng học tập. Đánh dấu một nút bấm là Pro
 * thì không sao; đánh dấu một con người là Pro thì vi phạm thiết kế sản phẩm.
 */
export function ProBadge({
  locked = false,
  className,
}: {
  /** true = người dùng chưa có quyền → thêm ổ khoá cho rõ trạng thái. */
  locked?: boolean;
  className?: string;
}) {
  const t = useTranslations("pricing");
  const Icon = locked ? Lock : Sparkles;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-wide",
        // Trạng thái khoá vẫn phải ĐỌC ĐƯỢC: nền xám nhạt trên nền xám nhạt làm
        // nhãn chìm mất, người dùng không nhận ra đây là chức năng của gói Pro.
        locked
          ? "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-400"
          : "bg-primary/15 text-primary ring-1 ring-primary/25",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {t("plan.pro")}
    </span>
  );
}
