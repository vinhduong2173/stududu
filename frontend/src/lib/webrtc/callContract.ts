/**
 * Contract signaling gọi thoại — bản đối chiếu của
 * `backend/src/modules/calls/calls.types.ts`.
 *
 * TODO(contract): khi `shared/` được dựng (api-contract-convention.md mục 3.4),
 * xoá file này và import thẳng `@shared/api/calls.contract`. Giữ hai bản chép
 * tay là đúng cái bệnh "drift" mà convention đang muốn diệt — nhưng dựng alias
 * `@shared/*` cho cả NestJS lẫn Next.js là việc riêng, không gộp vào PR này.
 */

export type CallKind = "audio" | "video";

export type CallStatus =
  | "ringing"
  | "connected"
  | "ended"
  | "rejected"
  | "missed"
  | "failed"
  | "unavailable"
  | "busy";

export interface RtcSessionDescription {
  type: "offer" | "answer";
  sdp: string;
}

// ===== Client → Server =====

export interface CallInvitePayload {
  conversationId: number;
  calleeId: number;
  sdp: RtcSessionDescription;
  kind?: CallKind;
}

export interface CallAcceptPayload {
  callId: number;
  sdp: RtcSessionDescription;
}

export interface CallIcePayload {
  callId: number;
  candidate: RTCIceCandidateInit;
}

/**
 * `call:media-state` — video-call-upgrade.md mục 4.2. Đi hai chiều với cùng
 * một hình dạng: tắt camera bằng `track.enabled` không phát tín hiệu nào qua
 * WebRTC, không báo thì phía kia thấy hình đen và tưởng lỗi mạng.
 */
export interface CallMediaStatePayload {
  callId: number;
  audio: boolean;
  video: boolean;
}

// ===== Server → Client =====

export interface CallIncomingEvent {
  callId: number;
  conversationId: number;
  caller: { id: number; displayName: string; avatarUrl: string | null };
  sdp: RtcSessionDescription;
  kind: CallKind;
}

export interface CallAcceptedEvent {
  callId: number;
  sdp: RtcSessionDescription;
}

export interface CallEndedEvent {
  callId: number;
  durationSec: number;
  endReason: string;
}

export interface CallTimeoutWarningEvent {
  callId: number;
  secondsLeft: number;
}

/** Bản server → client của `call:media-state` — cùng hình dạng, không đổi gì. */
export type CallMediaStateEvent = CallMediaStatePayload;

// ===== Ack =====

export type CallAck<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export type InviteAck = CallAck<{ callId: number; blocked?: "busy" | "unavailable" }>;

// ===== Tin nhắn hệ thống tổng kết cuộc gọi (BR-25) =====

export interface CallMessagePayload {
  callId: number;
  kind: CallKind;
  status: "ended" | "missed" | "rejected";
  durationSec: number;
  callerId: number;
}

// ===== HTTP =====

export const CALLS_ROUTES = {
  iceConfig: "/calls/ice-config",
  history: (conversationId: number) => `/calls/history/${conversationId}`,
} as const;

export interface IceConfigResponse {
  iceServers: RTCIceServer[];
}
