/** Hằng số cuộc gọi thoại — docs/02-design/audio-call-design.md */

/** Thời gian đổ chuông trước khi tính là cuộc gọi nhỡ (mục 13.4 — chốt 45s). */
export const RING_TIMEOUT_MS = 45_000;

/** BR-23 — thời lượng tối đa một cuộc gọi. */
export const MAX_CALL_MS = 30 * 60 * 1000;

/** BR-23 — cảnh báo trước khi tự ngắt (phút 28). */
export const TIMEOUT_WARNING_MS = 28 * 60 * 1000;

/** Trạng thái còn "sống" — dùng để kiểm tra bận (glare, mục 9). */
export const ACTIVE_CALL_STATUSES = ['ringing', 'connected'] as const;
