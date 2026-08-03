"use client";

import * as React from "react";
import type { CallKind, RtcSessionDescription } from "./callContract";
import { capVideoBitrate } from "./bitrate";
import { getLocalStream, getVideoConstraints, type FacingMode } from "./constraints";
import { getIceServers, getIceTransportPolicy } from "./iceConfig";

/**
 * Điểm ④ của audio-call-design.md mục 8 — toàn bộ logic WebRTC, KHÔNG biết gì
 * về UI. Trộn phần này thẳng vào component thì sau này bật video phải mổ lại.
 *
 * Hook không phân biệt audio/video: `kind` chỉ đi tiếp vào `getMediaConstraints`.
 * Riêng video có thêm ba việc — giới hạn bitrate (BR-34), tắt/bật camera bằng
 * `track.enabled` (BR-35) và đổi camera trước/sau bằng `replaceTrack`; cả ba
 * đều KHÔNG cần thương lượng lại kết nối (video-call-upgrade.md mục 4).
 */

/** Mất kết nối quá ngưỡng này thì coi như hỏng (máy trạng thái mục 5). */
const DISCONNECT_GRACE_MS = 15_000;

export interface PeerConnectionCallbacks {
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onFailed: () => void;
}

export interface PeerConnectionApi {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  toggleMic: () => void;
  /** Có luồng camera cục bộ hay không — nhận cuộc gọi kiểu audio thì luôn false. */
  hasCamera: boolean;
  cameraEnabled: boolean;
  /** BR-35 — tắt/bật bằng `track.enabled`, không đụng tới kết nối. */
  toggleCamera: () => void;
  /** Cho micro nhưng chặn riêng camera (trap mục 7) — vẫn gọi được, chỉ mất hình. */
  cameraBlocked: boolean;
  /** Máy có từ 2 camera trở lên (điện thoại) mới hiện nút đổi camera. */
  canSwitchCamera: boolean;
  switchCamera: () => Promise<void>;
  /** Camera sau thì KHÔNG lật gương — chỉ camera trước mới lật (mục 5). */
  facingMode: FacingMode;
  /** `connectionState === "disconnected"` — mạng chập chờn, chưa hỏng hẳn. */
  networkUnstable: boolean;
  /** Người gọi: xin micro/camera → tạo offer. */
  createOffer: (kind: CallKind) => Promise<RtcSessionDescription>;
  /** Người nhận: xin micro/camera → nhận offer → tạo answer. */
  createAnswer: (kind: CallKind, offer: RtcSessionDescription) => Promise<RtcSessionDescription>;
  /** Người gọi: nhận answer của phía kia. */
  acceptAnswer: (answer: RtcSessionDescription) => Promise<void>;
  addRemoteCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  /** Dọn sạch: stop mọi track (tắt đèn micro + camera) + đóng peer connection. */
  close: () => void;
}

export function usePeerConnection(callbacks: PeerConnectionCallbacks): PeerConnectionApi {
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  /**
   * Trap mục 9 — ICE candidate hay tới TRƯỚC remote description. Gọi
   * `addIceCandidate` lúc đó sẽ ném lỗi và kết nối hỏng ngẫu nhiên, nên xếp
   * hàng đợi rồi nạp sau khi `setRemoteDescription` xong.
   */
  const pendingCandidatesRef = React.useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescRef = React.useRef(false);
  const disconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const facingRef = React.useRef<FacingMode>("user");

  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = React.useState(true);
  const [hasCamera, setHasCamera] = React.useState(false);
  const [cameraEnabled, setCameraEnabled] = React.useState(true);
  const [cameraBlocked, setCameraBlocked] = React.useState(false);
  const [canSwitchCamera, setCanSwitchCamera] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<FacingMode>("user");
  const [networkUnstable, setNetworkUnstable] = React.useState(false);

  // Giữ callback trong ref: handler của RTCPeerConnection gắn một lần, không
  // được bắt closure cũ. Gán trong effect vì handler chỉ chạy sau khi render xong.
  const callbacksRef = React.useRef(callbacks);
  React.useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const clearDisconnectTimer = React.useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const close = React.useCallback(() => {
    clearDisconnectTimer();
    // Trap mục 9 — không stop() thì đèn micro vẫn sáng, người dùng tưởng bị nghe
    // lén. Với camera còn nghiêm trọng hơn (trap mục 7 của video).
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    pendingCandidatesRef.current = [];
    hasRemoteDescRef.current = false;
    facingRef.current = "user";
    setLocalStream(null);
    setRemoteStream(null);
    setMicEnabled(true);
    setHasCamera(false);
    setCameraEnabled(true);
    setCameraBlocked(false);
    setCanSwitchCamera(false);
    setFacingMode("user");
    setNetworkUnstable(false);
  }, [clearDisconnectTimer]);

  const createPeerConnection = React.useCallback(async (): Promise<RTCPeerConnection> => {
    const iceServers = await getIceServers();
    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: getIceTransportPolicy(),
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) callbacksRef.current.onIceCandidate(event.candidate.toJSON());
    };

    pc.ontrack = (event) => {
      // event.streams[0] là stream phía xa; dùng luôn để UI gắn vào <audio>/<video>.
      setRemoteStream(event.streams[0] ?? null);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        clearDisconnectTimer();
        setNetworkUnstable(false);
        return;
      }
      if (state === "failed") {
        clearDisconnectTimer();
        setNetworkUnstable(false);
        callbacksRef.current.onFailed();
        return;
      }
      if (state === "disconnected") {
        // Mục 5 (video) — người dùng cần biết hình đứng là do mạng, không phải app hỏng.
        setNetworkUnstable(true);
        if (!disconnectTimerRef.current) {
          // Chớp mạng thì tự hồi; quá 15 giây mới coi là hỏng.
          disconnectTimerRef.current = setTimeout(() => {
            disconnectTimerRef.current = null;
            if (pcRef.current?.connectionState !== "connected") callbacksRef.current.onFailed();
          }, DISCONNECT_GRACE_MS);
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, [clearDisconnectTimer]);

  /** Có ít nhất 2 camera thì mới hiện nút đổi trước/sau (mục 5). */
  const detectCameras = React.useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    setCanSwitchCamera(devices.filter((d) => d.kind === "videoinput").length > 1);
  }, []);

  const attachLocalMedia = React.useCallback(
    async (pc: RTCPeerConnection, kind: CallKind) => {
      const { stream, cameraBlocked: blocked } = await getLocalStream(kind, facingRef.current);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraBlocked(blocked);

      const videoTracks = stream.getVideoTracks();
      setHasCamera(videoTracks.length > 0);
      setCameraEnabled(videoTracks.length > 0);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      /**
       * Gọi video nhưng không có camera (bị chặn quyền) — vẫn phải mở m-line
       * video hướng `recvonly`, nếu không offer không có chỗ cho hình và mình
       * mất luôn khả năng NHÌN THẤY đối phương, chứ không chỉ mất hình của mình.
       * Phía nhận không cần bước này: offer đã có sẵn m-line để khớp vào.
       */
      if (kind === "video" && videoTracks.length === 0) {
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      // enumerateDevices chỉ trả đủ danh sách SAU khi đã được cấp quyền.
      if (videoTracks.length > 0) void detectCameras();
    },
    [detectCameras],
  );

  const flushPendingCandidates = React.useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      await pc.addIceCandidate(candidate).catch(() => undefined);
    }
  }, []);

  const createOffer = React.useCallback(
    async (kind: CallKind): Promise<RtcSessionDescription> => {
      const pc = await createPeerConnection();
      await attachLocalMedia(pc, kind);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return { type: "offer", sdp: offer.sdp ?? "" };
    },
    [attachLocalMedia, createPeerConnection],
  );

  const createAnswer = React.useCallback(
    async (kind: CallKind, offer: RtcSessionDescription): Promise<RtcSessionDescription> => {
      const pc = await createPeerConnection();
      await attachLocalMedia(pc, kind);
      await pc.setRemoteDescription(offer);
      hasRemoteDescRef.current = true;
      await flushPendingCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // BR-34 — đặt trần bitrate ngay khi sender đã tồn tại (mục 3.2).
      await capVideoBitrate(pc);
      return { type: "answer", sdp: answer.sdp ?? "" };
    },
    [attachLocalMedia, createPeerConnection, flushPendingCandidates],
  );

  const acceptAnswer = React.useCallback(
    async (answer: RtcSessionDescription): Promise<void> => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(answer);
      hasRemoteDescRef.current = true;
      await flushPendingCandidates();
      await capVideoBitrate(pc);
    },
    [flushPendingCandidates],
  );

  const addRemoteCandidate = React.useCallback(
    async (candidate: RTCIceCandidateInit): Promise<void> => {
      const pc = pcRef.current;
      if (!pc || !hasRemoteDescRef.current) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      await pc.addIceCandidate(candidate).catch(() => undefined);
    },
    [],
  );

  const toggleMic = React.useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (tracks.length === 0) return;
    const next = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = next));
    setMicEnabled(next);
  }, []);

  /**
   * BR-35 — `enabled = false` khiến track gửi khung hình rỗng, băng thông tụt
   * gần về 0 và KHÔNG cần thương lượng lại kết nối (mục 4.1). Việc báo cho phía
   * kia (`call:media-state`) là của lớp trên, hook này không biết gì về socket.
   */
  const toggleCamera = React.useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    if (tracks.length === 0) return;
    const next = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = next));
    setCameraEnabled(next);
  }, []);

  /**
   * Đổi camera trước/sau (mục 5). `replaceTrack` đổi nguồn hình mà không thương
   * lượng lại — đúng công cụ cho việc này.
   */
  const switchCamera = React.useCallback(async () => {
    const pc = pcRef.current;
    const stream = localStreamRef.current;
    if (!pc || !stream) return;

    const oldTrack = stream.getVideoTracks()[0];
    if (!oldTrack) return;

    const next: FacingMode = facingRef.current === "user" ? "environment" : "user";
    const fresh = await navigator.mediaDevices
      .getUserMedia({ video: getVideoConstraints(next) })
      .catch(() => null);
    const newTrack = fresh?.getVideoTracks()[0];
    if (!newTrack) return; // không có camera thứ hai — giữ nguyên, không báo lỗi ồn ào

    newTrack.enabled = oldTrack.enabled; // đang tắt camera thì đổi xong vẫn tắt
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    await sender?.replaceTrack(newTrack);
    oldTrack.stop();

    // Tạo stream MỚI thay vì sửa tại chỗ: <video> chỉ gắn lại khi srcObject đổi tham chiếu.
    const updated = new MediaStream([...stream.getAudioTracks(), newTrack]);
    localStreamRef.current = updated;
    facingRef.current = next;
    setFacingMode(next);
    setLocalStream(updated);

    // encodings có thể bị đặt lại theo track mới — áp trần bitrate lần nữa cho chắc.
    await capVideoBitrate(pc);
  }, []);

  // Rời trang giữa cuộc gọi vẫn phải tắt micro và camera.
  React.useEffect(() => close, [close]);

  return {
    localStream,
    remoteStream,
    micEnabled,
    toggleMic,
    hasCamera,
    cameraEnabled,
    toggleCamera,
    cameraBlocked,
    canSwitchCamera,
    switchCamera,
    facingMode,
    networkUnstable,
    createOffer,
    createAnswer,
    acceptAnswer,
    addRemoteCandidate,
    close,
  };
}
