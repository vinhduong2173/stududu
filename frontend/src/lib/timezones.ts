// Múi giờ + khung giờ rảnh cho tính năng hẹn lịch chat (theo bản Figma Make)

export const TIMEZONES = [
  { code: "VN", name: "Việt Nam", flag: "🇻🇳", offset: 7 },
  { code: "UK", name: "Anh (UK)", flag: "🇬🇧", offset: 0 },
  { code: "JP", name: "Nhật Bản", flag: "🇯🇵", offset: 9 },
  { code: "KR", name: "Hàn Quốc", flag: "🇰🇷", offset: 9 },
  { code: "US_ET", name: "Mỹ (ET)", flag: "🇺🇸", offset: -5 },
  { code: "AU", name: "Úc (AEST)", flag: "🇦🇺", offset: 10 },
  { code: "SG", name: "Singapore", flag: "🇸🇬", offset: 8 },
  { code: "FR", name: "Pháp", flag: "🇫🇷", offset: 1 },
] as const;

export type Timezone = (typeof TIMEZONES)[number];

export const TIME_SLOTS = [
  { id: "s1", label: "07:00–09:00", start: 7, end: 9 },
  { id: "s2", label: "09:00–11:00", start: 9, end: 11 },
  { id: "s3", label: "12:00–14:00", start: 12, end: 14 },
  { id: "s4", label: "17:00–19:00", start: 17, end: 19 },
  { id: "s5", label: "20:00–22:00", start: 20, end: 22 },
  { id: "s6", label: "22:00–24:00", start: 22, end: 24 },
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export function getTimezone(code?: string | null): Timezone {
  return TIMEZONES.find((t) => t.code === code) ?? TIMEZONES[0];
}

export const convertHour = (hour: number, fromOffset: number, toOffset: number) =>
  (hour - fromOffset + toOffset + 48) % 24;

/** Đổi khung giờ từ múi giờ này sang múi giờ khác, trả về nhãn "HH:00–HH:00" */
export function convertSlot(slot: TimeSlot, fromOffset: number, toOffset: number): string {
  const startH = convertHour(slot.start, fromOffset, toOffset);
  const endH = convertHour(slot.end, fromOffset, toOffset);
  const fmt = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
  return `${fmt(startH)}–${fmt(endH === 0 ? 24 : endH)}`;
}

/** Hai khung giờ (ở 2 múi giờ khác nhau) có giao nhau theo giờ UTC không */
export function slotsOverlap(
  slot1: TimeSlot,
  offset1: number,
  slot2: TimeSlot,
  offset2: number,
): boolean {
  const s1 = slot1.start - offset1;
  const e1 = slot1.end - offset1;
  const s2 = slot2.start - offset2;
  const e2 = slot2.end - offset2;
  return s1 < e2 && e1 > s2;
}

/** Giờ hiện tại tại một múi giờ, dạng "HH:mm" */
export function currentTimeAt(offset: number): string {
  const now = new Date();
  const h = (now.getUTCHours() + offset + 24) % 24;
  return `${String(h).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
}

export const TRANSLATE_LANGS = [
  { code: "auto", flag: "🔍", name: "Tự nhận diện" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
] as const;

export const VOCAB_LANGS = [
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
  { code: "ja", flag: "🇯🇵", name: "Nhật" },
  { code: "ko", flag: "🇰🇷", name: "Hàn" },
  { code: "zh", flag: "🇨🇳", name: "Trung" },
  { code: "fr", flag: "🇫🇷", name: "Pháp" },
] as const;
