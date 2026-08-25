import { api } from "@/lib/api";

/** EP-11 — kiểu dữ liệu & lời gọi API của gói Pro (SRS §4.1, §5.2). */

export type PlanCode = "free" | "pro";

/** SRS §3.5 — giá gói Pro (đồng bộ với backend `PRO_MONTHLY_PRICE_VND`). */
export const PRO_MONTHLY_PRICE_VND = 29_000;

export type SubscriptionStatus =
  | "free"
  | "pending_payment"
  | "active"
  | "past_due"
  | "canceling";

export type EntitlementKey =
  | "translate.lookup"
  | "vocabulary.save"
  | "chat.image_upload"
  | "match.like"
  | "match.advanced_filter";

export interface Entitlement {
  key: EntitlementKey;
  kind: "quota" | "cap" | "boolean";
  plan: PlanCode;
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string | null;
  warn: boolean;
}

export interface SubscriptionState {
  plan: PlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  canceledAt: string | null;
  provider: string;
  price: { amount: number; currency: string };
  entitlements: Entitlement[];
}

/** Trạng thái còn quyền Pro — BR-41 (grace) và BR-42 (canceling) đều còn quyền. */
export const PRO_STATUSES: SubscriptionStatus[] = [
  "active",
  "past_due",
  "canceling",
];

/**
 * Slug dùng làm khoá i18n cho từng hạng mục.
 *
 * Không dùng thẳng EntitlementKey được: next-intl coi dấu "." là ký hiệu lồng
 * cấp namespace nên `features.translate.lookup` sẽ bị hiểu thành 3 tầng và ném
 * INVALID_KEY ngay khi nạp messages.
 */
export const FEATURE_MESSAGE_KEY: Record<EntitlementKey, string> = {
  "translate.lookup": "translate_lookup",
  "vocabulary.save": "vocabulary_save",
  "chat.image_upload": "chat_image_upload",
  "match.like": "match_like",
  "match.advanced_filter": "match_advanced_filter",
};

/** SRS §3.2 — thứ tự hiển thị 5 hạng mục trên bảng so sánh. */
export const PLAN_FEATURE_ORDER: EntitlementKey[] = [
  "translate.lookup",
  "vocabulary.save",
  "chat.image_upload",
  "match.like",
  "match.advanced_filter",
];

export const getSubscription = () =>
  api<SubscriptionState>("/subscription/me");

export const startCheckout = () =>
  api<{ url: string; sessionId: string }>("/subscription/checkout", {
    method: "POST",
  });

export const confirmCheckout = (sessionId: string, cardNumber: string) =>
  api("/subscription/checkout/confirm", {
    method: "POST",
    body: { sessionId, cardNumber },
  });

export const cancelSubscription = () =>
  api("/subscription/cancel", { method: "POST" });

export const resumeSubscription = () =>
  api("/subscription/resume", { method: "POST" });

export function formatPrice(amount: number, locale: string) {
  return `${amount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} ₫`;
}
