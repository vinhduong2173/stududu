"use client";

import * as React from "react";
import { Phone, PhoneMissed, PhoneOff, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/components/call/CallScreen";
import type { CallMessagePayload } from "@/lib/webrtc/callContract";

interface CallMessageBubbleProps {
  payload: CallMessagePayload;
  mine: boolean;
  t: any;
}

export function CallMessageBubble({ payload, mine, t }: CallMessageBubbleProps) {
  const isVideo = payload.kind === "video";
  const label =
    payload.status === "ended"
      ? t(isVideo ? "call.log_ended_video" : "call.log_ended", {
          duration: formatDuration(payload.durationSec),
        })
      : payload.status === "rejected"
        ? t("call.log_rejected")
        : mine
          ? t("call.log_missed_outgoing")
          : t("call.log_missed_incoming");

  const Icon =
    payload.status === "ended"
      ? isVideo
        ? Video
        : Phone
      : payload.status === "rejected"
        ? PhoneOff
        : PhoneMissed;

  return (
    <div className="flex justify-center my-2">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium",
          payload.status === "ended" ? "text-muted" : "text-error",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    </div>
  );
}
