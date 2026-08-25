import { PlanCode } from '@prisma/client';

/**
 * Entitlement Matrix — SRS §4.1.
 *
 * BR-39: đây là NƠI DUY NHẤT được biết một gói cho phép làm gì. Mã nghiệp vụ
 * không bao giờ so sánh `plan === 'pro'`; nó hỏi EntitlementsService.
 *
 * - quota   = đếm lượt dùng, reset theo chu kỳ (UsageCounter)
 * - cap     = trần tổng tích luỹ, không reset (đếm từ dữ liệu thật)
 * - boolean = bật/tắt tính năng
 */
export type EntitlementKind = 'quota' | 'cap' | 'boolean';
export type ResetPeriod = 'daily' | 'none';

export interface EntitlementRule {
  kind: EntitlementKind;
  reset: ResetPeriod;
  limits: Record<PlanCode, number>;
}

export const ENTITLEMENT_KEYS = [
  'translate.lookup',
  'vocabulary.save',
  'chat.image_upload',
  'match.like',
  'match.advanced_filter',
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

// Giá trị 1/0 ở nhóm boolean = bật/tắt, không phải hạn mức.
export const ENTITLEMENTS: Record<EntitlementKey, EntitlementRule> = {
  'translate.lookup': {
    kind: 'quota',
    reset: 'daily',
    limits: { free: 30, pro: 500 },
  },
  'vocabulary.save': {
    kind: 'cap',
    reset: 'none',
    limits: { free: 100, pro: 2000 },
  },
  'chat.image_upload': {
    kind: 'quota',
    reset: 'daily',
    limits: { free: 10, pro: 100 },
  },
  // BR-45: hạn mức Like áp dụng cho MỌI tài khoản kể cả Pro — trần Pro không
  // vượt 50/ngày để giữ hiệu lực chống spam.
  'match.like': {
    kind: 'quota',
    reset: 'daily',
    limits: { free: 10, pro: 50 },
  },
  'match.advanced_filter': {
    kind: 'boolean',
    reset: 'none',
    limits: { free: 0, pro: 1 },
  },
};

// Ngưỡng cảnh báo "sắp hết lượt" (US-39 AC2) — còn ≤ 5 lượt hoặc ≤ 20% hạn mức.
export const QUOTA_WARNING_ABSOLUTE = 5;
export const QUOTA_WARNING_RATIO = 0.2;

export function isEntitlementKey(value: string): value is EntitlementKey {
  return (ENTITLEMENT_KEYS as readonly string[]).includes(value);
}
