import { api } from "@/lib/api";
import { CALLS_ROUTES, type IceConfigResponse } from "./callContract";

/**
 * Điểm ④ mục 8 — lớp logic, không biết gì về UI.
 * Cấu hình ICE lấy từ backend (mục 7.1) để đổi credential TURN chỉ cần sửa
 * `backend/.env`, không phải build lại frontend.
 */

const FALLBACK: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

let cached: RTCIceServer[] | null = null;

export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached) return cached;
  try {
    const res = await api<IceConfigResponse>(CALLS_ROUTES.iceConfig);
    cached = res.iceServers?.length ? res.iceServers : FALLBACK;
  } catch {
    // Mất endpoint thì vẫn gọi được trong LAN — hỏng hẳn còn tệ hơn.
    cached = FALLBACK;
  }
  return cached;
}

/** Credential TURN có hạn — gọi khi cuộc gọi thất bại để lần sau lấy bản mới. */
export function clearIceCache(): void {
  cached = null;
}

/**
 * Mẹo test mức 4 (mục 10): ép mọi kết nối đi qua TURN để biết TURN có thật sự
 * chạy không, khỏi phải chờ gặp mạng khó. Bật bằng
 * `NEXT_PUBLIC_FORCE_TURN=1`.
 */
export function getIceTransportPolicy(): RTCIceTransportPolicy {
  return process.env.NEXT_PUBLIC_FORCE_TURN === "1" ? "relay" : "all";
}
