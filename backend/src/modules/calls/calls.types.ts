import type { CallKind, CallStatus } from '@prisma/client';

/**
 * Contract signaling gọi thoại — audio-call-design.md mục 4.
 * Socket.IO là ngoại lệ có chủ đích của envelope APIResponse<T>
 * (api-contract-convention.md mục 4.4 câu 3): event socket đi đường riêng,
 * ack trả thẳng {ok,...} để client phân biệt thành công/thất bại.
 */

// ===== Client → Server =====

export interface CallInvitePayload {
  conversationId: number;
  calleeId: number;
  sdp: RtcSessionDescription;
  kind?: CallKind; // mặc định 'audio'
}

export interface CallAcceptPayload {
  callId: number;
  sdp: RtcSessionDescription;
}

export interface CallIdPayload {
  callId: number;
}

export interface CallIcePayload {
  callId: number;
  candidate: unknown; // RTCIceCandidateInit — server chỉ chuyển tiếp, không đọc nội dung
}

/**
 * `call:media-state` — video-call-upgrade.md mục 4.2.
 * Tắt camera/micro làm bằng `track.enabled` nên WebRTC không phát tín hiệu nào
 * cho phía kia; thiếu event này thì họ thấy hình đen và tưởng lỗi mạng.
 * Đi hai chiều với cùng một hình dạng: client gửi lên, server chuyển tiếp
 * nguyên vẹn cho phía còn lại và KHÔNG lưu (chỉ có nghĩa trong lúc đang gọi).
 */
export interface CallMediaStatePayload {
  callId: number;
  audio: boolean;
  video: boolean;
}

/** Bản rút gọn của RTCSessionDescriptionInit (không có lib DOM ở backend). */
export interface RtcSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
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

// ===== Ack trả về cho client =====

export type CallAck<T = Record<string, never>> =
  ({ ok: true } & T) | { ok: false; error: string; reason?: CallStatus };

// ===== Tin nhắn hệ thống tổng kết cuộc gọi (BR-25) =====

export interface CallMessagePayload {
  callId: number;
  kind: CallKind;
  /** Chỉ ba trạng thái này sinh tin nhắn — busy/failed/unavailable là nhiễu. */
  status: 'ended' | 'missed' | 'rejected';
  durationSec: number;
  callerId: number;
}

// ===== HTTP =====

/** GET /calls/ice-config */
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}
export interface IceConfigResponse {
  iceServers: IceServerConfig[];
}

/** GET /calls/history/:conversationId */
export interface CallHistoryItem {
  id: number;
  callerId: number;
  calleeId: number;
  kind: CallKind;
  status: CallStatus;
  invitedAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSec: number;
}
