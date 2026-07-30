"use client";

import * as React from "react";
import { Mic, MicOff, PhoneOff, SwitchCamera, Video, VideoOff, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { CallKind } from "@/lib/webrtc/callContract";
import type { FacingMode } from "@/lib/webrtc/constraints";
import type { CallPartner } from "./CallProvider";

/**
 * Điểm ③ mục 8 của audio-call-design.md — component CHỈ hiển thị, không chứa
 * logic WebRTC. Bố cục video theo video-call-upgrade.md mục 5: khung đối phương
 * chiếm toàn màn, khung của mình nhỏ ở góc và LẬT GƯƠNG.
 *
 * Tiếng của đối phương phát qua thẻ <audio> trong CallProvider, nên thẻ <video>
 * ở đây luôn `muted` — không thì hai nguồn cùng phát, nghe vọng gấp đôi.
 */
export function CallScreen({
  partner,
  self,
  kind,
  connected,
  startedAt,
  micEnabled,
  onToggleMic,
  hasCamera,
  cameraEnabled,
  onToggleCamera,
  cameraBlocked,
  canSwitchCamera,
  onSwitchCamera,
  facingMode,
  remoteCameraOn,
  networkUnstable,
  localStream,
  remoteStream,
  onHangUp,
}: {
  partner: CallPartner;
  /** Avatar của chính mình — hiện ở khung nhỏ khi mình tắt camera. */
  self: { displayName: string; avatarUrl?: string | null } | null;
  kind: CallKind;
  connected: boolean;
  startedAt: number | null;
  micEnabled: boolean;
  onToggleMic: () => void;
  hasCamera: boolean;
  cameraEnabled: boolean;
  onToggleCamera: () => void;
  cameraBlocked: boolean;
  canSwitchCamera: boolean;
  onSwitchCamera: () => void;
  facingMode: FacingMode;
  remoteCameraOn: boolean;
  networkUnstable: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
}) {
  const t = useTranslations("call");
  const elapsed = useElapsedSeconds(startedAt);

  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const isVideo = kind === "video";
  const remoteHasVideoTrack = useHasVideoTrack(remoteStream);

  // BR-35 — hình đen là lỗi UX nặng nhất của video call: người dùng tưởng mạng
  // hỏng. Chỉ hiện khung hình khi CHẮC CHẮN có hình để hiện.
  const showRemoteVideo = isVideo && remoteHasVideoTrack && remoteCameraOn;
  const showLocalVideo = isVideo && hasCamera && cameraEnabled;

  React.useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  React.useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-foreground/95 backdrop-blur-sm px-6 py-12 text-background">
      {/* Khung hình đối phương — chiếm toàn màn, ẩn khi gọi thoại hoặc bên kia tắt camera */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        className={cn("absolute inset-0 h-full w-full object-cover", !showRemoteVideo && "hidden")}
      />

      {/* Khung hình của mình — LẬT GƯƠNG, chỉ với camera trước (mục 5) */}
      <div
        className={cn(
          "absolute bottom-28 right-6 h-40 w-28 overflow-hidden rounded-2xl bg-foreground shadow-xl",
          !isVideo && "hidden",
        )}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            facingMode === "user" && "-scale-x-100",
            !showLocalVideo && "hidden",
          )}
        />
        {!showLocalVideo && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-background/70">
            <Avatar
              src={self?.avatarUrl ?? undefined}
              fallback={(self?.displayName ?? "?").charAt(0)}
              size="md"
            />
            <VideoOff className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>

      {/* Trạng thái mạng — mục 5: cho biết là do mạng, không phải app hỏng */}
      {networkUnstable && (
        <div
          role="status"
          className="relative flex items-center gap-2 rounded-full bg-background/20 px-4 py-1.5 text-xs font-medium"
        >
          <WifiOff className="h-3.5 w-3.5" aria-hidden />
          {t("network_unstable")}
        </div>
      )}

      {/* Có hình đối phương thì tên + thời lượng nổi lên trên, không che mặt người ta */}
      <div
        className={cn(
          "relative flex flex-1 flex-col items-center gap-4 text-center",
          showRemoteVideo ? "justify-start" : "justify-center",
        )}
      >
        <div className={cn(showRemoteVideo && "hidden")}>
          <Avatar
            src={partner.avatarUrl ?? undefined}
            fallback={partner.displayName.charAt(0)}
            size="xl"
            className={cn(!connected && "animate-pulse")}
          />
        </div>

        <div
          className={cn(
            showRemoteVideo && "rounded-2xl bg-foreground/50 px-4 py-2 backdrop-blur-sm",
          )}
        >
          <p className={cn("font-bold", showRemoteVideo ? "text-lg" : "text-2xl")}>
            {partner.displayName}
          </p>
          <p className="text-sm text-background/70" aria-live="polite">
            {connected ? formatDuration(elapsed) : t("calling")}
          </p>
        </div>

        {/* Đối phương tắt camera — nói rõ thay vì để người dùng đoán */}
        {isVideo && connected && !showRemoteVideo && (
          <p className="rounded-full bg-background/20 px-4 py-1.5 text-xs font-medium">
            {t("partner_camera_off")}
          </p>
        )}

        {/* Cho micro nhưng chặn camera (trap mục 7) — vẫn gọi được, chỉ mất hình */}
        {isVideo && cameraBlocked && (
          <p className="max-w-xs rounded-2xl bg-background/20 px-4 py-2 text-xs">
            {t("error_camera_permission")}
          </p>
        )}
      </div>

      <div className="relative flex items-center gap-4">
        <button
          onClick={onToggleMic}
          aria-pressed={!micEnabled}
          aria-label={micEnabled ? t("mute") : t("unmute")}
          title={micEnabled ? t("mute") : t("unmute")}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
            micEnabled
              ? "bg-background/20 hover:bg-background/30"
              : "bg-background text-foreground hover:bg-background/90",
          )}
        >
          {micEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>

        {/* BR-35 — không có luồng camera thì không có gì để tắt/bật (nhận cuộc
            gọi video ở chế độ audio, hoặc bị chặn quyền camera) */}
        {isVideo && hasCamera && (
          <button
            onClick={onToggleCamera}
            aria-pressed={!cameraEnabled}
            aria-label={cameraEnabled ? t("camera_off") : t("camera_on")}
            title={cameraEnabled ? t("camera_off") : t("camera_on")}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              cameraEnabled
                ? "bg-background/20 hover:bg-background/30"
                : "bg-background text-foreground hover:bg-background/90",
            )}
          >
            {cameraEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>
        )}

        {isVideo && hasCamera && canSwitchCamera && (
          <button
            onClick={onSwitchCamera}
            aria-label={t("switch_camera")}
            title={t("switch_camera")}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background/20 transition-colors hover:bg-background/30"
          >
            <SwitchCamera className="h-6 w-6" />
          </button>
        )}

        <button
          onClick={onHangUp}
          aria-label={t("hang_up")}
          title={t("hang_up")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-error text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

/**
 * Phía kia nhận cuộc gọi video ở chế độ audio (BR-37) thì stream không có video
 * track nào — không đợi `call:media-state` cũng biết là phải hiện avatar.
 */
function useHasVideoTrack(stream: MediaStream | null): boolean {
  // MediaStream là hệ thống ngoài React — đọc bằng useSyncExternalStore thay vì
  // đồng bộ qua useEffect + setState (cascading render, eslint chặn đúng).
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (!stream) return () => undefined;
      stream.addEventListener("addtrack", onChange);
      stream.addEventListener("removetrack", onChange);
      return () => {
        stream.removeEventListener("addtrack", onChange);
        stream.removeEventListener("removetrack", onChange);
      };
    },
    [stream],
  );

  const getSnapshot = React.useCallback(() => (stream?.getVideoTracks().length ?? 0) > 0, [stream]);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Đồng hồ chỉ chạy khi đã kết nối — khớp mốc `startedAt` bên server (mục 5),
 * nên thời gian đổ chuông không bị đếm vào.
 * Nhịp đập giữ trong state, thời lượng suy ra khi render (không setState trong effect).
 */
function useElapsedSeconds(startedAt: number | null): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (startedAt === null) return 0;
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
