"use client";

import * as React from "react";
import { CornerUpLeft, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReplyToInfo {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  type?: string;
}

interface MessageReplyQuoteProps {
  replyTo: ReplyToInfo;
  senderId: number;
  meId: number;
  partnerName: string;
  t: any;
  onScrollToMessage: (id: number) => void;
}

export function MessageReplyQuote({
  replyTo,
  senderId,
  meId,
  partnerName,
  t,
  onScrollToMessage,
}: MessageReplyQuoteProps) {
  const isMine = senderId === meId;
  const isTargetMine = replyTo.senderId === meId;

  const headerLabel = isMine
    ? isTargetMine
      ? t("chat.replied_yourself")
      : t("chat.replied_to", { name: partnerName })
    : isTargetMine
      ? t("chat.partner_replied_to_you", { name: partnerName })
      : t("chat.partner_replied_themselves", { name: partnerName });

  return (
    <div className={cn("mb-1.5 flex flex-col max-w-full text-left", isMine ? "items-end" : "items-start")}>
      <div className="flex items-center gap-1 text-[11px] text-muted/90 mb-0.5 px-1 font-medium select-none">
        <CornerUpLeft className="w-3 h-3 shrink-0" />
        <span>{headerLabel}</span>
      </div>

      <button
        type="button"
        onClick={() => onScrollToMessage(replyTo.id)}
        className={cn(
          "text-left rounded-xl px-3 py-1.5 text-xs transition-all max-w-[280px] sm:max-w-[340px] truncate border cursor-pointer group",
          isMine
            ? "bg-teal-700/60 text-white/90 border-teal-500/40 hover:bg-teal-700/80"
            : "bg-muted/40 text-foreground/80 border-border/80 hover:bg-muted/60",
        )}
        title="Nhấn để cuộn đến tin nhắn gốc"
      >
        <div className="flex items-center gap-1.5 truncate">
          {replyTo.type === "image" ? (
            <span className="flex items-center gap-1 italic opacity-90">
              <ImageIcon className="w-3 h-3" /> {t("chat.photo")}
            </span>
          ) : (
            <span className="truncate">{replyTo.content}</span>
          )}
        </div>
      </button>
    </div>
  );
}
