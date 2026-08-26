"use client";

import * as React from "react";
import { CornerUpLeft, Pencil, X } from "lucide-react";
import { ReplyToInfo } from "./MessageReplyQuote";
import { Message } from "@/hooks/useChatInbox";

interface ChatInputReplyBarProps {
  replyingTo: ReplyToInfo | null;
  editingMessage: Message | null;
  t: any;
  onCancel: () => void;
}

export function ChatInputReplyBar({
  replyingTo,
  editingMessage,
  t,
  onCancel,
}: ChatInputReplyBarProps) {
  if (!replyingTo && !editingMessage) return null;

  return (
    <div className="px-4 py-2 bg-muted/20 border-b border-border/80 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {editingMessage ? (
          <>
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 shrink-0">
              <Pencil className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">{t("chat.editing_message") || "Đang chỉnh sửa tin nhắn"}</p>
              <p className="text-muted truncate text-[11px]">{editingMessage.content}</p>
            </div>
          </>
        ) : replyingTo ? (
          <>
            <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0">
              <CornerUpLeft className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">
                {t("chat.replying_to", { name: replyingTo.senderName }) || `Đang trả lời ${replyingTo.senderName}`}
              </p>
              <p className="text-muted truncate text-[11px]">{replyingTo.content}</p>
            </div>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-full text-muted hover:text-foreground hover:bg-muted/30 transition-colors shrink-0"
        title={t("chat.cancel") || "Hủy"}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
