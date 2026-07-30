"use client";

import * as React from "react";
import type { Socket } from "socket.io-client";
import { useTranslations } from "next-intl";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/components/features/TrustDialogs";
import { classifyMediaError, type MediaErrorReason } from "@/lib/webrtc/constraints";
import { usePeerConnection } from "@/lib/webrtc/usePeerConnection";
import type {
  CallAcceptedEvent,
  CallEndedEvent,
  CallIcePayload,
  CallIncomingEvent,
  CallKind,
  CallMediaStateEvent,
  CallMediaStatePayload,
  CallTimeoutWarningEvent,
  InviteAck,
} from "@/lib/webrtc/callContract";
import { api } from "@/lib/api";
import { CallScreen } from "./CallScreen";
import { IncomingCallModal } from "./IncomingCallModal";

/**
 * Điểm ④ mục 8 của audio-call-design.md — nơi nối lớp logic (`lib/webrtc`) với
 * lớp giao diện (`CallScreen`, `IncomingCallModal`). Provider đặt ở layout
 * `(main)` nên chuông đổ được ở bất kỳ trang nào, không chỉ khi đang mở Inbox.
 *
 * Máy trạng thái ở đây là bản chiếu của mục 5; nguồn sự thật vẫn là CallSession
 * bên server — UI chỉ phản ứng theo event.
 */

export interface CallPartner {
  id: number;
  displayName: string;
  avatarUrl?: string | null;
}

type CallState =
  | { phase: "idle" }
  | {
      phase: "outgoing";
      callId: number | null;
      conversationId: number;
      partner: CallPartner;
      kind: CallKind;
    }
  | { phase: "incoming"; callId: number; partner: CallPartner; kind: CallKind }
  | { phase: "active"; callId: number; partner: CallPartner; kind: CallKind; startedAt: number };

/** Trạng thái micro/camera của PHÍA KIA — chỉ biết qua `call:media-state`. */
interface RemoteMediaState {
  audio: boolean;
  video: boolean;
}

const REMOTE_MEDIA_DEFAULT: RemoteMediaState = { audio: true, video: true };

interface CallContextValue {
  /** Bấm nút gọi trong Inbox. Phải chạy trong sự kiện người dùng bấm (iOS). */
  startCall: (conversationId: number, partner: CallPartner, kind?: CallKind) => void;
  /** Đang bận thì Inbox khoá nút gọi. */
  busy: boolean;
}

const CallContext = React.createContext<CallContextValue>({
  startCall: () => undefined,
  busy: false,
});

export function useCall(): CallContextValue {
  return React.useContext(CallContext);
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("call");
  const { show: showToast, toast } = useToast();

  const [state, setState] = React.useState<CallState>({ phase: "idle" });
  const [remoteMedia, setRemoteMedia] = React.useState<RemoteMediaState>(REMOTE_MEDIA_DEFAULT);
  /** Avatar của chính mình cho khung nhỏ khi tắt camera (mục 5). */
  const [self, setSelf] = React.useState<{
    displayName: string;
    avatarUrl?: string | null;
  } | null>(null);
  // Bản mới nhất của state cho các handler socket (đăng ký một lần, deps rỗng).
  // Gán trong effect chứ không gán khi render — mọi chỗ đọc đều nằm ngoài render.
  const stateRef = React.useRef<CallState>(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const socketRef = React.useRef<Socket | null>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);
  /** Offer của cuộc gọi đến, giữ tới khi người dùng bấm nhận. */
  const pendingOfferRef = React.useRef<CallIncomingEvent | null>(null);
  /**
   * ICE candidate của mình bắn ra ngay sau setLocalDescription — sớm hơn lúc
   * server trả callId trong ack của `call:invite`. Xếp hàng cho tới khi có id.
   */
  const outgoingCandidatesRef = React.useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = React.useRef<number | null>(null);

  const emit = React.useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const sendCandidate = React.useCallback(
    (candidate: RTCIceCandidateInit) => {
      const callId = callIdRef.current;
      if (callId === null) {
        outgoingCandidatesRef.current.push(candidate);
        return;
      }
      emit("call:ice-candidate", { callId, candidate } satisfies CallIcePayload);
    },
    [emit],
  );

  const peer = usePeerConnection({
    onIceCandidate: sendCandidate,
    onFailed: () => {
      const callId = callIdRef.current;
      if (callId !== null) emit("call:end", { callId });
      showToast(t("failed"));
      resetRef.current();
    },
  });

  /** Dọn sạch mọi thứ về idle — dùng ở rất nhiều nhánh nên gói lại một chỗ. */
  const reset = React.useCallback(() => {
    peer.close();
    callIdRef.current = null;
    outgoingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    setRemoteMedia(REMOTE_MEDIA_DEFAULT);
    setState({ phase: "idle" });
  }, [peer]);

  // reset() được tham chiếu bên trong callback của usePeerConnection (khai báo
  // trước nó), nên đi qua ref để không vướng thứ tự khai báo.
  const resetRef = React.useRef(reset);
  React.useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  const mediaErrorMessage = React.useCallback(
    (reason: MediaErrorReason): string => {
      if (reason === "insecure-context") return t("error_insecure");
      if (reason === "permission-denied") return t("error_permission");
      if (reason === "no-device") return t("error_no_device");
      if (reason === "camera-busy") return t("error_camera_busy");
      return t("error_unknown");
    },
    [t],
  );

  /** Trap mục 9 — iOS Safari chặn tự phát; play() phải nằm trong sự kiện bấm. */
  const primeAudio = React.useCallback(() => {
    void remoteAudioRef.current?.play().catch(() => undefined);
  }, []);

  // ===== Người gọi =====

  const startCall = React.useCallback(
    (conversationId: number, partner: CallPartner, kind: CallKind = "audio") => {
      if (stateRef.current.phase !== "idle") return;
      setState({ phase: "outgoing", callId: null, conversationId, partner, kind });
      primeAudio();

      void (async () => {
        let sdp;
        try {
          sdp = await peer.createOffer(kind);
        } catch (err) {
          showToast(mediaErrorMessage(classifyMediaError(err)));
          resetRef.current();
          return;
        }

        socketRef.current?.emit(
          "call:invite",
          { conversationId, calleeId: partner.id, sdp, kind },
          (ack: InviteAck) => {
            if (!ack?.ok) {
              showToast(ack?.error ?? t("error_unknown"));
              resetRef.current();
              return;
            }
            if (ack.blocked === "busy") {
              showToast(t("partner_busy", { name: partner.displayName }));
              resetRef.current();
              return;
            }
            if (ack.blocked === "unavailable") {
              showToast(t("partner_offline", { name: partner.displayName }));
              resetRef.current();
              return;
            }

            callIdRef.current = ack.callId;
            setState((prev) =>
              prev.phase === "outgoing" ? { ...prev, callId: ack.callId } : prev,
            );
            const queued = outgoingCandidatesRef.current;
            outgoingCandidatesRef.current = [];
            queued.forEach((candidate) =>
              socketRef.current?.emit("call:ice-candidate", { callId: ack.callId, candidate }),
            );
          },
        );
      })();
    },
    [mediaErrorMessage, peer, primeAudio, showToast, t],
  );

  const cancelOutgoing = React.useCallback(() => {
    const callId = callIdRef.current;
    if (callId !== null) emit("call:cancel", { callId });
    reset();
  }, [emit, reset]);

  // ===== Người nhận =====

  /**
   * BR-37 — `withCamera=false` thì chỉ xin micro: answer không có video track,
   * mình vẫn NHÌN THẤY đối phương (m-line video thành recvonly) nhưng không
   * xuất hiện. Không xin camera rồi tắt, vì xin là đèn camera đã sáng.
   *
   * Đổi ý giữa cuộc thì phải thương lượng lại kết nối — mục 4.3 đã hoãn, nên
   * chọn lúc bắt máy là chốt cho cả cuộc.
   */
  const acceptIncoming = React.useCallback((withCamera = true) => {
    const current = stateRef.current;
    const offer = pendingOfferRef.current;
    if (current.phase !== "incoming" || !offer) return;
    primeAudio();

    const mediaKind: CallKind = current.kind === "video" && withCamera ? "video" : "audio";

    void (async () => {
      try {
        const sdp = await peer.createAnswer(mediaKind, offer.sdp);
        emit("call:accept", { callId: current.callId, sdp });
        setState({
          phase: "active",
          callId: current.callId,
          partner: current.partner,
          kind: current.kind,
          startedAt: Date.now(),
        });
      } catch (err) {
        showToast(mediaErrorMessage(classifyMediaError(err)));
        emit("call:reject", { callId: current.callId });
        resetRef.current();
      }
    })();
  }, [emit, mediaErrorMessage, peer, primeAudio, showToast]);

  const rejectIncoming = React.useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "incoming") return;
    emit("call:reject", { callId: current.callId });
    reset();
  }, [emit, reset]);

  const hangUp = React.useCallback(() => {
    const callId = callIdRef.current;
    if (callId !== null) emit("call:end", { callId });
    reset();
  }, [emit, reset]);

  // ===== Lắng nghe signaling =====

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    const onIncoming = (event: CallIncomingEvent) => {
      // Server đã chặn bận (mục 9); nhánh này chỉ để chắc chắn không chồng cuộc.
      if (stateRef.current.phase !== "idle") {
        socket.emit("call:reject", { callId: event.callId });
        return;
      }
      pendingOfferRef.current = event;
      callIdRef.current = event.callId;
      setState({
        phase: "incoming",
        callId: event.callId,
        partner: {
          id: event.caller.id,
          displayName: event.caller.displayName,
          avatarUrl: event.caller.avatarUrl,
        },
        kind: event.kind,
      });
    };

    const onAccepted = (event: CallAcceptedEvent) => {
      const current = stateRef.current;
      if (current.phase !== "outgoing") return;
      void peer.acceptAnswer(event.sdp).then(() => {
        setState({
          phase: "active",
          callId: event.callId,
          partner: current.partner,
          kind: current.kind,
          startedAt: Date.now(),
        });
      });
    };

    const onCandidate = (payload: { callId: number; candidate: RTCIceCandidateInit }) => {
      void peer.addRemoteCandidate(payload.candidate);
    };

    // Mục 4.2 — phía kia tắt/bật camera hoặc micro. Không có event này thì họ
    // tắt camera là mình thấy hình đen và tưởng lỗi mạng.
    const onMediaState = (event: CallMediaStateEvent) => {
      if (stateRef.current.phase === "idle") return;
      setRemoteMedia({ audio: event.audio, video: event.video });
    };

    const onRejected = () => {
      if (stateRef.current.phase === "idle") return;
      showToast(t("rejected"));
      resetRef.current();
    };

    const onMissed = () => {
      const current = stateRef.current;
      if (current.phase === "idle") return;
      // Người gọi thấy "không trả lời"; người nhận chỉ cần tắt chuông.
      if (current.phase === "outgoing") showToast(t("no_answer"));
      resetRef.current();
    };

    const onEnded = (event: CallEndedEvent) => {
      if (stateRef.current.phase === "idle") return;
      if (event.endReason === "timeout") showToast(t("ended_max_duration"));
      resetRef.current();
    };

    const onTimeoutWarning = (event: CallTimeoutWarningEvent) => {
      if (stateRef.current.phase !== "active") return;
      showToast(t("timeout_warning", { minutes: Math.round(event.secondsLeft / 60) }));
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:ice-candidate", onCandidate);
    socket.on("call:media-state", onMediaState);
    socket.on("call:rejected", onRejected);
    socket.on("call:missed", onMissed);
    socket.on("call:ended", onEnded);
    socket.on("call:timeout-warning", onTimeoutWarning);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:ice-candidate", onCandidate);
      socket.off("call:media-state", onMediaState);
      socket.off("call:rejected", onRejected);
      socket.off("call:missed", onMissed);
      socket.off("call:ended", onEnded);
      socket.off("call:timeout-warning", onTimeoutWarning);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đóng tab giữa cuộc gọi — báo sớm cho phía kia. Server vẫn có handleDisconnect
  // làm lưới an toàn khi trình duyệt không kịp gửi.
  React.useEffect(() => {
    const onBeforeUnload = () => {
      const callId = callIdRef.current;
      if (callId !== null) socketRef.current?.emit("call:end", { callId });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /**
   * Mục 4.2 — báo trạng thái micro/camera của mình cho phía kia. Effect chạy cả
   * lần đầu khi vào `active`, nên trường hợp nhận cuộc gọi video ở chế độ audio
   * (BR-37) cũng được báo ngay, không phải chờ người dùng bấm gì.
   */
  React.useEffect(() => {
    if (state.phase !== "active") return;
    const payload: CallMediaStatePayload = {
      callId: state.callId,
      audio: peer.micEnabled,
      video: peer.hasCamera && peer.cameraEnabled,
    };
    socketRef.current?.emit("call:media-state", payload);
  }, [state, peer.micEnabled, peer.hasCamera, peer.cameraEnabled]);

  // Avatar của mình cho khung hình nhỏ khi tắt camera — chỉ lấy khi thật sự có
  // cuộc gọi, không thêm request cho người chưa gọi bao giờ.
  React.useEffect(() => {
    if (state.phase === "idle" || self) return;
    let cancelled = false;
    api<{ displayName: string; avatarUrl?: string | null }>("/users/me")
      .then((me) => {
        if (!cancelled) setSelf({ displayName: me.displayName, avatarUrl: me.avatarUrl });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [state.phase, self]);

  // Gắn luồng âm thanh phía xa vào phần tử <audio> luôn nằm sẵn trong DOM.
  React.useEffect(() => {
    const el = remoteAudioRef.current;
    if (!el) return;
    el.srcObject = peer.remoteStream;
    if (peer.remoteStream) void el.play().catch(() => undefined);
  }, [peer.remoteStream]);

  const value = React.useMemo<CallContextValue>(
    () => ({ startCall, busy: state.phase !== "idle" }),
    [startCall, state.phase],
  );

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* Luôn có mặt trong DOM để play() gọi được ngay trong sự kiện bấm (iOS). */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {state.phase === "incoming" && (
        <IncomingCallModal
          partner={state.partner}
          kind={state.kind}
          onAccept={acceptIncoming}
          onReject={rejectIncoming}
        />
      )}

      {(state.phase === "outgoing" || state.phase === "active") && (
        <CallScreen
          partner={state.partner}
          self={self}
          kind={state.kind}
          connected={state.phase === "active"}
          startedAt={state.phase === "active" ? state.startedAt : null}
          micEnabled={peer.micEnabled}
          onToggleMic={peer.toggleMic}
          hasCamera={peer.hasCamera}
          cameraEnabled={peer.cameraEnabled}
          onToggleCamera={peer.toggleCamera}
          cameraBlocked={peer.cameraBlocked}
          canSwitchCamera={peer.canSwitchCamera}
          onSwitchCamera={() => void peer.switchCamera()}
          facingMode={peer.facingMode}
          remoteCameraOn={remoteMedia.video}
          networkUnstable={peer.networkUnstable}
          localStream={peer.localStream}
          remoteStream={peer.remoteStream}
          onHangUp={state.phase === "active" ? hangUp : cancelOutgoing}
        />
      )}

      {toast}
    </CallContext.Provider>
  );
}
