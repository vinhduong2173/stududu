"use client";

import * as React from "react";
import type { Socket } from "socket.io-client";
import { Avatar } from "@/components/ui/Avatar";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CallInfo = {
  conversationId: number;
  callerId: number;
  callerName: string;
  callerAvatar?: string | null;
};

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  conversationId: number;
  partner: {
    id: number;
    displayName: string;
    avatarUrl?: string | null;
  };
  currentUser: {
    id: number;
    displayName?: string;
  };
  isIncoming?: boolean;
  incomingCallInfo?: CallInfo | null;
}

export function VideoCallModal({
  isOpen,
  onClose,
  socket,
  conversationId,
  partner,
  currentUser,
  isIncoming = false,
  incomingCallInfo = null,
}: VideoCallModalProps) {
  const [callState, setCallState] = React.useState<
    "calling" | "incoming" | "connected" | "ended"
  >(isIncoming ? "incoming" : "calling");

  const [isMicMuted, setIsMicMuted] = React.useState(false);
  const [isCamOff, setIsCamOff] = React.useState(false);
  const [callDuration, setCallDuration] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const activePartner = isIncoming && incomingCallInfo
    ? { id: incomingCallInfo.callerId, displayName: incomingCallInfo.callerName, avatarUrl: incomingCallInfo.callerAvatar }
    : partner;

  // Cấu hình STUN Server cho WebRTC Peer Connection
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // ----- Dọn dẹp stream & peer connection -----
  const cleanupCall = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  // ----- Kết thúc cuộc gọi -----
  const handleEndCall = React.useCallback(
    (notifyPartner = true) => {
      if (notifyPartner && socket) {
        socket.emit("call:end", {
          conversationId,
          targetUserId: activePartner.id,
        });
      }
      setCallState("ended");
      cleanupCall();
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    [socket, conversationId, activePartner.id, cleanupCall, onClose],
  );

  // ----- Khởi tạo camera & mic bản thân -----
  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.error("Không thể mở Camera/Microphone:", err);
      setErrorMessage("Không thể truy cập Camera/Microphone. Vui lòng cấp quyền trình duyệt.");
      return null;
    }
  };

  // ----- Tạo WebRTC Peer Connection -----
  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    // Thêm các track cá nhân vào peer connection
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Lắng nghe stream từ đối phương
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Gửi ICE candidate qua socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc:ice-candidate", {
          targetUserId: activePartner.id,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        startTimer();
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        handleEndCall(false);
      }
    };

    return pc;
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // ----- Bắt đầu gọi (Phía Người Gọi) -----
  const startCalling = React.useCallback(async () => {
    if (!socket) return;
    setCallState("calling");
    setErrorMessage(null);

    const stream = await initLocalStream();
    if (!stream) return;

    // Phát sự kiện mời cuộc gọi
    socket.emit("call:invite", {
      conversationId,
      targetUserId: activePartner.id,
      callerName: currentUser.displayName || "Người dùng",
    });
  }, [socket, conversationId, activePartner.id, currentUser.displayName]);

  // ----- Chấp nhận cuộc gọi (Phía Người Nhận) -----
  const acceptCall = async () => {
    if (!socket) return;
    setCallState("calling");
    setErrorMessage(null);

    const stream = await initLocalStream();
    if (!stream) {
      handleEndCall(true);
      return;
    }

    socket.emit("call:accept", {
      conversationId,
      targetUserId: activePartner.id,
    });
  };

  // ----- Từ chối cuộc gọi -----
  const rejectCall = () => {
    if (socket) {
      socket.emit("call:reject", {
        conversationId,
        targetUserId: activePartner.id,
      });
    }
    setCallState("ended");
    cleanupCall();
    onClose();
  };

  // ----- Đổi trạng thái Bật/Tắt Mic -----
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // ----- Đổi trạng thái Bật/Tắt Camera -----
  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  // ----- Lắng nghe Socket Events cho cuộc gọi -----
  React.useEffect(() => {
    if (!socket || !isOpen) return;

    // Đối phương chấp nhận cuộc gọi → Tạo WebRTC Offer
    const onCallAccepted = async () => {
      if (!localStreamRef.current) return;
      const pc = createPeerConnection(localStreamRef.current);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", {
          targetUserId: activePartner.id,
          offer,
        });
      } catch (err) {
        console.error("Lỗi khi tạo WebRTC offer:", err);
      }
    };

    // Khi người gọi tạo offer → Người nhận tạo WebRTC Answer
    const onWebrtcOffer = async (data: { senderId: number; offer: RTCSessionDescriptionInit }) => {
      if (data.senderId !== activePartner.id) return;
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await initLocalStream();
        if (!stream) return;
      }
      const pc = pcRef.current || createPeerConnection(stream);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          targetUserId: activePartner.id,
          answer,
        });
      } catch (err) {
        console.error("Lỗi khi xử lý WebRTC offer:", err);
      }
    };

    // Nhận Answer từ người nhận
    const onWebrtcAnswer = async (data: { senderId: number; answer: RTCSessionDescriptionInit }) => {
      if (data.senderId !== activePartner.id || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (err) {
        console.error("Lỗi khi nhận WebRTC answer:", err);
      }
    };

    // Nhận ICE Candidate
    const onWebrtcIceCandidate = async (data: { senderId: number; candidate: RTCIceCandidateInit }) => {
      if (data.senderId !== activePartner.id || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("Lỗi khi thêm ICE Candidate:", err);
      }
    };

    // Đối phương từ chối
    const onCallRejected = () => {
      setErrorMessage("Đối phương đã từ chối cuộc gọi");
      setCallState("ended");
      cleanupCall();
      setTimeout(() => onClose(), 2000);
    };

    // Đối phương kết thúc cuộc gọi
    const onCallEnded = () => {
      setErrorMessage("Cuộc gọi đã kết thúc");
      setCallState("ended");
      cleanupCall();
      setTimeout(() => onClose(), 1500);
    };

    socket.on("call:accepted", onCallAccepted);
    socket.on("webrtc:offer", onWebrtcOffer);
    socket.on("webrtc:answer", onWebrtcAnswer);
    socket.on("webrtc:ice-candidate", onWebrtcIceCandidate);
    socket.on("call:rejected", onCallRejected);
    socket.on("call:ended", onCallEnded);

    if (!isIncoming && callState === "calling" && !localStreamRef.current) {
      startCalling();
    }

    return () => {
      socket.off("call:accepted", onCallAccepted);
      socket.off("webrtc:offer", onWebrtcOffer);
      socket.off("webrtc:answer", onWebrtcAnswer);
      socket.off("webrtc:ice-candidate", onWebrtcIceCandidate);
      socket.off("call:rejected", onCallRejected);
      socket.off("call:ended", onCallEnded);
    };
  }, [socket, isOpen, isIncoming, activePartner.id, startCalling, cleanupCall, onClose]);

  // Clean up khi unmount
  React.useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[700px] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-white">
        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/80 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar
              src={activePartner.avatarUrl ?? undefined}
              fallback={activePartner.displayName.charAt(0)}
              size="sm"
            />
            <div>
              <p className="font-semibold text-sm">{activePartner.displayName}</p>
              <p className="text-xs text-slate-300">
                {callState === "connected" ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {formatDuration(callDuration)}
                  </span>
                ) : callState === "calling" ? (
                  "Đang gọi…"
                ) : callState === "incoming" ? (
                  "Cuộc gọi video đến…"
                ) : (
                  "Đã kết thúc"
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleEndCall(true)}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Screen Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Main Remote Video View */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              callState === "connected" ? "opacity-100" : "opacity-0 absolute",
            )}
          />

          {/* Placeholder when not connected or camera off */}
          {callState !== "connected" && (
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="relative">
                {callState === "calling" || callState === "incoming" ? (
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping" />
                ) : null}
                <Avatar
                  src={activePartner.avatarUrl ?? undefined}
                  fallback={activePartner.displayName.charAt(0)}
                  size="xl"
                  className="w-24 h-24 text-3xl border-4 border-indigo-500/50 rounded-full shadow-xl flex items-center justify-center"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">{activePartner.displayName}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {errorMessage ||
                    (callState === "calling"
                      ? "Đang chờ đối phương nhấc máy…"
                      : callState === "incoming"
                      ? "Muốn thực hiện cuộc gọi video với bạn"
                      : "Cuộc gọi đã hoàn tất")}
                </p>
              </div>
            </div>
          )}

          {/* Floating Picture-in-Picture Local Video Preview */}
          <div
            className={cn(
              "absolute bottom-20 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-900 transition-all duration-300 z-10",
              callState === "connected" ? "block" : "hidden",
            )}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover transform -scale-x-100",
                isCamOff && "hidden",
              )}
            />
            {isCamOff && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                Camera tắt
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-[10px] font-semibold bg-slate-900/80 px-2 py-0.5 rounded-full text-slate-300">
              Bạn
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-center gap-4 sm:gap-6 z-20">
          {callState === "incoming" ? (
            <>
              <button
                onClick={rejectCall}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Từ chối</span>
              </button>
              <button
                onClick={acceptCall}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all animate-bounce"
              >
                <VideoIcon className="w-5 h-5" />
                <span>Chấp nhận</span>
              </button>
            </>
          ) : callState === "connected" || callState === "calling" ? (
            <>
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={cn(
                  "p-3.5 rounded-full transition-all duration-200 shadow-md",
                  isMicMuted
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white",
                )}
                title={isMicMuted ? "Bật Mic" : "Tắt Mic"}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Cam Toggle */}
              <button
                onClick={toggleCam}
                className={cn(
                  "p-3.5 rounded-full transition-all duration-200 shadow-md",
                  isCamOff
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white",
                )}
                title={isCamOff ? "Bật Camera" : "Tắt Camera"}
              >
                {isCamOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={() => handleEndCall(true)}
                className="p-3.5 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                title="Kết thúc cuộc gọi"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">Kết thúc</span>
              </button>
            </>
          ) : (
            <div className="text-slate-400 text-sm py-2">Cuộc gọi đã đóng</div>
          )}
        </div>
      </div>
    </div>
  );
}
