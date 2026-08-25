import { LanguageRole } from '@prisma/client';

/**
 * Bộ lọc ghép đôi nâng cao — hạng mục Pro duy nhất KHÔNG phải hạn mức (SRS §3.2).
 *
 * BR-46 — lằn ranh đạo đức của cả mô hình: bộ lọc chỉ THU HẸP danh sách đã được
 * xếp hạng, không đổi thứ tự và không thêm ai vào. Người dùng Free vẫn thấy đủ
 * 100% ứng viên theo đúng MATCH_SCORE; Pro chỉ được thêm công cụ lọc.
 */
export interface AdvancedFilter {
  timezone?: string;
  level?: string;
  topicId?: number;
}

export interface FilterableCandidate {
  user: {
    timezone: string | null;
    languages: { role: LanguageRole; level: string | null }[];
    interests: { topicId: number }[];
  };
}

export function hasAdvancedFilter(filter?: AdvancedFilter): boolean {
  if (!filter) return false;
  return Boolean(filter.timezone || filter.level || filter.topicId);
}

export function applyAdvancedFilter<T extends FilterableCandidate>(
  candidates: T[],
  filter?: AdvancedFilter,
): T[] {
  if (!hasAdvancedFilter(filter)) return candidates;

  return candidates.filter(
    (c) =>
      matchesTimezone(c, filter!.timezone) &&
      matchesLevel(c, filter!.level) &&
      matchesTopic(c, filter!.topicId),
  );
}

function matchesTimezone(c: FilterableCandidate, timezone?: string): boolean {
  return !timezone || c.user.timezone === timezone;
}

function matchesLevel(c: FilterableCandidate, level?: string): boolean {
  if (!level) return true;
  return c.user.languages.some(
    (l) => l.role === LanguageRole.learning && l.level === level,
  );
}

function matchesTopic(c: FilterableCandidate, topicId?: number): boolean {
  if (!topicId) return true;
  return c.user.interests.some((i) => i.topicId === topicId);
}
