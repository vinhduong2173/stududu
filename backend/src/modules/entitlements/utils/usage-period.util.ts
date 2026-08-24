/**
 * BR-40 — quota theo ngày reset vào 00:00 theo timezone NGƯỜI DÙNG, không phải
 * timezone server (US-39 AC3).
 *
 * Quy ước offset dùng trong toàn bộ file này: số phút lệch so với UTC, dương về
 * phía đông (UTC+7 = 420). Trình duyệt gửi lên qua header `x-timezone-offset`
 * bằng `-new Date().getTimezoneOffset()`.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

// Mã múi giờ trong hồ sơ người dùng (khớp frontend/src/lib/timezones.ts).
export const TIMEZONE_CODE_OFFSETS: Record<string, number> = {
  VN: 7,
  UK: 0,
  JP: 9,
  KR: 9,
  US_ET: -5,
  AU: 10,
  SG: 8,
  FR: 1,
};

const DEFAULT_OFFSET_MINUTES = TIMEZONE_CODE_OFFSETS.VN * 60;

/** Ưu tiên offset trình duyệt gửi lên; thiếu thì suy từ mã múi giờ hồ sơ. */
export function resolveOffsetMinutes(
  headerOffset?: number | null,
  timezoneCode?: string | null,
): number {
  if (
    typeof headerOffset === 'number' &&
    Number.isFinite(headerOffset) &&
    Math.abs(headerOffset) <= 14 * 60
  ) {
    return Math.trunc(headerOffset);
  }
  const hours = timezoneCode ? TIMEZONE_CODE_OFFSETS[timezoneCode] : undefined;
  return hours === undefined ? DEFAULT_OFFSET_MINUTES : hours * 60;
}

/** Thời điểm UTC ứng với 00:00 hôm nay theo giờ người dùng. */
export function dailyPeriodStart(now: Date, offsetMinutes: number): Date {
  const localMs = now.getTime() + offsetMinutes * MS_PER_MINUTE;
  const localMidnight = Math.floor(localMs / MS_PER_DAY) * MS_PER_DAY;
  return new Date(localMidnight - offsetMinutes * MS_PER_MINUTE);
}

/** Thời điểm quota được reset kế tiếp — hiển thị trong thông báo chạm hạn mức. */
export function nextDailyReset(now: Date, offsetMinutes: number): Date {
  return new Date(dailyPeriodStart(now, offsetMinutes).getTime() + MS_PER_DAY);
}
