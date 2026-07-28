/**
 * Điểm ② của audio-call-design.md mục 8 — gom media constraints về MỘT chỗ.
 *
 * Bật video sau này = đổi tham số truyền vào hàm này, KHÔNG sửa logic kết nối
 * (`usePeerConnection.ts`) và không sửa signaling: SDP tự mô tả có luồng media nào.
 */
export type CallKind = "audio" | "video";

/** Camera trước (`user`) hay sau (`environment`) — video-call-upgrade.md mục 5. */
export type FacingMode = "user" | "environment";

/**
 * BR-34 — 640×480 @ 24fps. Đây mới chỉ là nửa phần: constraints KHÔNG giới hạn
 * bitrate, phần đó nằm ở `bitrate.ts`.
 */
export function getVideoConstraints(facingMode: FacingMode = "user"): MediaTrackConstraints {
  return { width: 640, height: 480, frameRate: 24, facingMode };
}

export function getMediaConstraints(
  kind: CallKind,
  facingMode: FacingMode = "user",
): MediaStreamConstraints {
  return {
    // Trap mục 9 — không bật echoCancellation thì vọng tiếng và hú.
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: kind === "video" ? getVideoConstraints(facingMode) : false,
  };
}

/** Lý do không xin được micro — dịch ở tầng UI, không hardcode chuỗi tiếng Việt ở đây. */
export type MediaErrorReason = "insecure-context" | "permission-denied" | "no-device" | "unknown";

/**
 * Trap mục 9 — trình duyệt chặn getUserMedia khi không có HTTPS (localhost được
 * miễn). Phân loại lỗi ở đây để UI hiện đúng hướng dẫn thay vì treo im lặng.
 */
export function classifyMediaError(err: unknown): MediaErrorReason {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "insecure-context";
  }
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "permission-denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "no-device";
  return "unknown";
}

export interface LocalStreamResult {
  stream: MediaStream;
  /** Xin được micro nhưng KHÔNG xin được camera — UI báo nhẹ, không huỷ cuộc gọi. */
  cameraBlocked: boolean;
}

/**
 * Trap mục 7 (video) — người dùng có thể cho micro nhưng chặn riêng camera.
 * `getUserMedia({audio, video})` khi đó hỏng CẢ HAI, nên phải thử lại chỉ với
 * micro: mất hình còn hơn mất cả cuộc gọi.
 */
export async function getLocalStream(
  kind: CallKind,
  facingMode: FacingMode = "user",
): Promise<LocalStreamResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    // Ném lỗi có `name` để classifyMediaError phân loại được đồng nhất.
    throw Object.assign(new Error("getUserMedia unavailable"), { name: "SecurityError" });
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      getMediaConstraints(kind, facingMode),
    );
    return { stream, cameraBlocked: false };
  } catch (err) {
    if (kind !== "video") throw err;
    const reason = classifyMediaError(err);
    // Lỗi không phải do camera (không có HTTPS chẳng hạn) thì thử lại vô ích.
    if (reason !== "permission-denied" && reason !== "no-device") throw err;

    const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints("audio"));
    return { stream, cameraBlocked: true };
  }
}
