"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { BookOpen, CalendarClock, Check, Globe, Phone, PhoneMissed, PhoneOff, Smile, Sparkles, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/components/call/CallScreen";
import type { CallMessagePayload } from "@/lib/webrtc/callContract";
import { formatBubbleTime, Message, REACTION_EMOJIS, SchedulePayload } from "@/hooks/useChatInbox";

interface MessageBubbleItemProps {
  t: any;
  m: Message;
  meId: number;
  partnerName: string;
  myTimezone?: string | null;
  partnerTimezone?: string | null;
  handleTranslate: (msg: Message) => void;
  showTranslationFor: Record<number, boolean>;
  translations: Record<number, string>;
  translating: Record<number, boolean>;
  setWordSaveTarget: (text: string) => void;
  reactionPickerFor: number | null;
  setReactionPickerFor: React.Dispatch<React.SetStateAction<number | null>>;
  handleToggleReaction: (msgId: number, emoji: string) => void;
  respondScheduleRequest: (requestId: number, action: "accept" | "decline") => void;
  openCancelDialog: (requestId: number) => void;
}

function CallMessageBubble({
  payload,
  mine,
  t,
}: {
  payload: CallMessagePayload;
  mine: boolean;
  t: any;
}) {
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

export function MessageBubbleItem({
  t,
  m,
  meId,
  partnerName,
  myTimezone,
  partnerTimezone,
  handleTranslate,
  showTranslationFor,
  translations,
  translating,
  setWordSaveTarget,
  reactionPickerFor,
  setReactionPickerFor,
  handleToggleReaction,
  respondScheduleRequest,
  openCancelDialog,
}: MessageBubbleItemProps) {
  const mine = m.senderId === meId;

  if (m.type === "call" && m.payload && "kind" in m.payload) {
    return <CallMessageBubble payload={m.payload as CallMessagePayload} mine={mine} t={t} />;
  }

  const isSchedule = m.type === "schedule" && m.payload;
  const sched = isSchedule ? (m.payload as SchedulePayload) : null;

  return (
    <div className={cn("flex flex-col mb-4 group/msg relative", mine ? "items-end" : "items-start")}>
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
        {!mine && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactionPickerFor((prev) => (prev === m.id ? null : m.id))}
              className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-muted hover:text-foreground rounded-full bg-surface shadow border border-border"
              title="Thêm cảm xúc"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            {reactionPickerFor === m.id && (
              <div className="absolute left-0 bottom-full mb-1 flex items-center gap-1 rounded-full bg-surface border border-border p-1 shadow-lg z-20">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleToggleReaction(m.id, emoji)}
                    className="p-1 hover:scale-125 transition-transform text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "rounded-3xl p-4 shadow-sm text-sm relative",
            mine
              ? "bg-gradient-to-r from-primary to-primary-hover text-white rounded-br-none"
              : "bg-surface border border-border text-foreground rounded-bl-none",
          )}
        >
          {m.type === "text" && (!m.payload || !("quizId" in (m.payload as any))) && (
            <p className="whitespace-pre-wrap break-words">{m.content}</p>
          )}

          {m.payload && "quizId" in (m.payload as any) && (
            <div className="space-y-2.5 min-w-[220px] p-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse shrink-0" />
                <span>Thách đấu Đề thi Quiz</span>
              </div>
              <div className="rounded-2xl bg-black/10 dark:bg-white/10 p-3 space-y-1">
                <p className="font-bold text-xs line-clamp-2">{(m.payload as any).quizTitle}</p>
                <div className="flex items-center gap-2 text-[11px] opacity-80">
                  <span>{(m.payload as any).level}</span>
                  <span>•</span>
                  <span>{(m.payload as any).questionCount || 10} câu hỏi</span>
                </div>
              </div>
              <a
                href={`/quiz/${(m.payload as any).quizId}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl font-bold text-xs transition-all shadow-sm",
                  mine
                    ? "bg-white text-primary hover:bg-white/90"
                    : "bg-primary text-white hover:bg-primary-hover",
                )}
              >
                <span>Làm bài thi ngay 🚀</span>
              </a>
            </div>
          )}

          {m.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.content}
              alt="Sent photo"
              className="rounded-2xl max-w-full max-h-72 object-cover"
            />
          )}

          {isSchedule && sched && (
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
          )}

          {/* Dịch inline */}
          {m.type === "text" && showTranslationFor[m.id] && (
            <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-90 italic">
              🌐 {translations[m.id]}
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-1 text-[10px]",
              mine ? "text-white/80" : "text-muted",
            )}
          >
            <span>{formatBubbleTime(m.sentAt)}</span>
            {mine && (
              <span>
                {m.pending ? "🕒" : m.readAt ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>

        {mine && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactionPickerFor((prev) => (prev === m.id ? null : m.id))}
              className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-muted hover:text-foreground rounded-full bg-surface shadow border border-border"
              title="Thêm cảm xúc"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            {reactionPickerFor === m.id && (
              <div className="absolute right-0 bottom-full mb-1 flex items-center gap-1 rounded-full bg-surface border border-border p-1 shadow-lg z-20">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleToggleReaction(m.id, emoji)}
                    className="p-1 hover:scale-125 transition-transform text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hiển thị các lượt reaction */}
      {m.reactions && Object.keys(m.reactions).length > 0 && (
        <div className={cn("flex flex-wrap gap-1 mt-1 px-1", mine ? "justify-end" : "justify-start")}>
          {Object.entries(m.reactions).map(([emoji, uids]) => {
            if (!uids || uids.length === 0) return null;
            const iReacted = uids.includes(meId);
            return (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(m.id, emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors",
                  iReacted
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-surface border-border text-muted hover:border-primary/50",
                )}
              >
                <span>{emoji}</span>
                <span>{uids.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bar công cụ phụ bên dưới tin nhắn text */}
      {m.type === "text" && (
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={() => handleTranslate(m)}
            disabled={translating[m.id]}
            className="text-[11px] text-muted hover:text-primary flex items-center gap-1"
          >
            <Globe className="h-3 w-3" />
            {translating[m.id]
              ? t("chat.translating")
              : showTranslationFor[m.id]
                ? t("chat.hide_translation")
                : t("chat.translate")}
          </button>

          <button
            onClick={() => setWordSaveTarget(m.content)}
            className="text-[11px] text-muted hover:text-primary flex items-center gap-1"
          >
            <BookOpen className="h-3 w-3" />
            {t("chat.save_word")}
          </button>
        </div>
      )}
    </div>
  );
}
