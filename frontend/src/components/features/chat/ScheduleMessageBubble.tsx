"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { CalendarClock, Check, X } from "lucide-react";
import { SchedulePayload } from "@/hooks/useChatInbox";

interface ScheduleMessageBubbleProps {
  sched: SchedulePayload;
  mine: boolean;
  t: any;
  respondScheduleRequest: (requestId: number, action: "accept" | "decline") => void;
  openCancelDialog: (requestId: number) => void;
}

export function ScheduleMessageBubble({
  sched,
  mine,
  t,
  respondScheduleRequest,
  openCancelDialog,
}: ScheduleMessageBubbleProps) {
  return (
    <div className="space-y-3 min-w-[220px]">
      <div className="flex items-center gap-2 font-bold">
        <CalendarClock className="h-5 w-5" />
        <span>{t("chat.schedule_title")}</span>
      </div>
      <p className="text-xs opacity-90">
        {sched.timeUtc
          ? new Date(sched.timeUtc).toLocaleString("vi-VN", {
              dateStyle: "full",
              timeStyle: "short",
            })
          : `${sched.myTimeLabel || ""} / ${sched.partnerTimeLabel || ""}`}
      </p>

      <div className="pt-2 border-t border-white/20">
        {sched.status === "pending" && !mine && sched.requestId && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => respondScheduleRequest(sched.requestId!, "accept")}
            >
              <Check className="h-4 w-4 mr-1" /> {t("chat.schedule_accept")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => respondScheduleRequest(sched.requestId!, "decline")}
            >
              <X className="h-4 w-4 mr-1" /> {t("chat.schedule_decline")}
            </Button>
          </div>
        )}

        {sched.status === "accepted" && (
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-success-light bg-black/20 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" /> {t("chat.schedule_accepted")}
            </span>
            {sched.requestId && (
              <button
                type="button"
                onClick={() => openCancelDialog(sched.requestId!)}
                className="block text-xs underline opacity-80 hover:opacity-100"
              >
                {t("chat.schedule_cancel_link")}
              </button>
            )}
          </div>
        )}

        {sched.status === "declined" && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white/70 bg-black/20 px-2.5 py-1 rounded-full">
            {t("chat.schedule_declined")}
          </span>
        )}

        {sched.status === "cancelled" && (
          <div className="text-xs opacity-80">
            <p className="font-bold">{t("chat.schedule_cancelled")}</p>
            {sched.cancelReason && <p className="italic">Lý do: {sched.cancelReason}</p>}
          </div>
        )}

        {sched.status === "expired" && (
          <span className="text-xs opacity-70 italic">{t("chat.schedule_expired")}</span>
        )}
      </div>
    </div>
  );
}
