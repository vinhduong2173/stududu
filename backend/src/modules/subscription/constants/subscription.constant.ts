/** Hằng số vòng đời subscription — SRS §3.5, §5.3, US-38 AC4. */

/** Giá gói Pro (SRS §3.5 — BA đề xuất, chờ Product Owner duyệt §12-1). */
export const PRO_MONTHLY_PRICE_VND = 29_000;
export const BILLING_CURRENCY = 'VND';

/** BR-41 — grace period 3 ngày, retry vào T+1 và T+2. */
export const GRACE_PERIOD_DAYS = 3;
export const MAX_RENEWAL_ATTEMPTS = 3;

/** §5.3 — nhắc gia hạn trước 7 ngày. */
export const RENEWAL_REMINDER_DAYS = 7;

/** US-38 AC4 — phiên thanh toán bỏ dở tự trở về `free` sau 30 phút. */
export const PENDING_PAYMENT_TTL_MINUTES = 30;

/** Chu kỳ chạy job nền (phút). Phải nhỏ hơn TTL ở trên để AC4 đúng hạn. */
export const JOB_INTERVAL_MINUTES = 5;

/** Giữ UsageCounter 90 ngày rồi dọn — bảng chỉ phục vụ hạn mức hiện hành. */
export const USAGE_RETENTION_DAYS = 90;

export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

/** Cộng đúng 1 tháng lịch, kẹp ngày cuối tháng (31/1 + 1 tháng = 28/2). */
export function addOneMonth(from: Date): Date {
  const next = new Date(from);
  const day = next.getDate();
  next.setMonth(next.getMonth() + 1);
  if (next.getDate() < day) next.setDate(0);
  return next;
}
