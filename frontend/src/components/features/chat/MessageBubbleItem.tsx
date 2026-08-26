"use client";

import * as React from "react";
import { Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallMessagePayload } from "@/lib/webrtc/callContract";
import { formatBubbleTime, Message, SchedulePayload } from "@/hooks/useChatInbox";
import { MessageReplyQuote, ReplyToInfo } from "./MessageReplyQuote";
import { MessageActionMenu } from "./MessageActionMenu";
import { ScheduleMessageBubble } from "./ScheduleMessageBubble";
import { CallMessageBubble } from "./CallMessageBubble";
import { MessageReactionsList } from "./MessageReactionsList";

interface MessageBubbleItemProps {
  t: any;
  m: Message;
  meId: number;
  partnerName: string;
  handleTranslate: (msg: Message) => void;
  showTranslationFor: Record<number, boolean>;
  translations: Record<number, string>;
  translating: Record<number, boolean>;
  reactionPickerFor: number | null;
  setReactionPickerFor: React.Dispatch<React.SetStateAction<number | null>>;
  handleToggleReaction: (msgId: number, emoji: string) => void;
  respondScheduleRequest: (requestId: number, action: "accept" | "decline") => void;
  openCancelDialog: (requestId: number) => void;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  onDelete: (msgId: number) => void;
  onScrollToMessage: (id: number) => void;
  isHighlighted?: boolean;
}

export function MessageBubbleItem({
  t,
  m,
  meId,
  partnerName,
  handleTranslate,
  showTranslationFor,
  translations,
  translating,
  reactionPickerFor,
  setReactionPickerFor,
  handleToggleReaction,
  respondScheduleRequest,
  openCancelDialog,
  onReply,
  onEdit,
  onDelete,
  onScrollToMessage,
  isHighlighted,
}: MessageBubbleItemProps) {
  const mine = m.senderId === meId;

  if (m.type === "call" && m.payload && "kind" in m.payload) {
    return <CallMessageBubble payload={m.payload as unknown as CallMessagePayload} mine={mine} t={t} />;
  }

  const isSchedule = m.type === "schedule" && m.payload;
  const sched = isSchedule ? (m.payload as SchedulePayload) : null;
  const isDeleted = Boolean(m.payload && "isDeleted" in m.payload && m.payload.isDeleted);
  const isEdited = Boolean(m.payload && "isEdited" in m.payload && m.payload.isEdited);
  const replyTo = m.payload && "replyTo" in m.payload && m.payload.replyTo ? (m.payload.replyTo as ReplyToInfo) : null;

  return (
    <div
      id={`message-${m.id}`}
      className={cn(
        "flex flex-col mb-4 group/msg relative transition-all duration-300 rounded-2xl p-1",
        mine ? "items-end" : "items-start",
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5",
      )}
    >
      {/* Khung trích dẫn tin nhắn được reply */}
      {replyTo && !isDeleted && (
        <MessageReplyQuote
          replyTo={replyTo}
          senderId={m.senderId}
          meId={meId}
          partnerName={partnerName}
          t={t}
          onScrollToMessage={onScrollToMessage}
        />
      )}

      <div className={cn("flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%]", mine ? "flex-row" : "flex-row-reverse")}>
        {!isDeleted && (
          <MessageActionMenu
            mine={mine}
            m={m}
            t={t}
            reactionPickerFor={reactionPickerFor}
            setReactionPickerFor={setReactionPickerFor}
            handleToggleReaction={handleToggleReaction}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm relative shadow-2xs",
            isDeleted
              ? "border border-dashed border-border/90 bg-muted/20 text-muted italic"
              : mine
                ? "bg-teal-600 text-white rounded-br-xs"
                : "bg-surface border border-border text-foreground rounded-bl-xs",
          )}
        >
          {isDeleted ? (
            <p className="text-xs">
              {mine
                ? t("chat.you_deleted_message") || "Bạn đã xóa một tin nhắn"
                : t("chat.partner_deleted_message", { name: partnerName }) || `${partnerName} đã xóa một tin nhắn`}
            </p>
          ) : (
            <>
              {m.type === "text" && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
              {m.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.content} alt="Sent photo" className="rounded-2xl max-w-full max-h-72 object-cover" />
              )}
              {isSchedule && sched && (
                <ScheduleMessageBubble
                  sched={sched}
                  mine={mine}
                  t={t}
                  respondScheduleRequest={respondScheduleRequest}
                  openCancelDialog={openCancelDialog}
                />
              )}

              {/* Dịch inline */}
              {m.type === "text" && showTranslationFor[m.id] && (
                <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-90 italic flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>{translations[m.id]}</span>
                </div>
              )}
            </>
          )}

          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-1 text-[10px]",
              mine && !isDeleted ? "text-white/80" : "text-muted",
            )}
          >
            <span>{formatBubbleTime(m.sentAt)}</span>
            {isEdited && !isDeleted && (
              <span className="italic opacity-90">· {t("chat.edited") || "Đã chỉnh sửa"}</span>
            )}
            {mine && !isDeleted && (
              <span>
                {m.pending ? <Clock className="w-2.5 h-2.5 inline" /> : m.readAt ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reaction badge list */}
      {!isDeleted && (
        <MessageReactionsList
          reactions={m.reactions}
          meId={meId}
          mine={mine}
          onToggleReaction={(emoji) => handleToggleReaction(m.id, emoji)}
        />
      )}

      {/* Bar dịch bên dưới tin nhắn text */}
      {!isDeleted && m.type === "text" && (
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => handleTranslate(m)}
            disabled={translating[m.id]}
            className="text-[11px] text-muted hover:text-primary flex items-center gap-1 cursor-pointer"
          >
            <Globe className="h-3 w-3" />
            {translating[m.id]
              ? t("chat.translating")
              : showTranslationFor[m.id]
                ? t("chat.hide_translation")
                : t("chat.translate")}
          </button>
        </div>
      )}
    </div>
  );
}
