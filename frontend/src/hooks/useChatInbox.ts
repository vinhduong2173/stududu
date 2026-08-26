"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import type { Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/components/features/TrustDialogs";
import { useCall } from "@/components/call/CallProvider";
import type { CallMessagePayload } from "@/lib/webrtc/callContract";
import { useLocale, useTranslations } from "next-intl";
import { compressImage } from "@/lib/utils";
import { ReplyToInfo } from "@/components/features/chat/MessageReplyQuote";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"] as const;

export type Partner = {
  id: number;
  displayName: string;
  avatarUrl?: string | null;
  lastActive?: string | null;
  timezone?: string | null;
  availableSlots?: string[];
};

export type SchedulePayload = {
  requestId?: number;
  timeUtc?: string;
  slotId?: string;
  myTimeLabel?: string;
  partnerTimeLabel?: string;
  status?: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  cancelReason?: string;
};

export type MessagePayload = {
  replyTo?: ReplyToInfo | null;
  isEdited?: boolean;
  editedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  requestId?: number;
  timeUtc?: string;
  slotId?: string;
  myTimeLabel?: string;
  partnerTimeLabel?: string;
  status?: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  cancelReason?: string;
  durationSec?: number;
  kind?: "audio" | "video";
};

export type Conversation = {
  id: number;
  partner: Partner;
  lastMessage: { content: string; sentAt: string; senderId: number; type?: string; payload?: MessagePayload | null } | null;
  unreadCount: number;
  createdAt: string;
  isConnected?: boolean;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  type: "text" | "image" | "schedule" | "call";
  content: string;
  payload?: MessagePayload | null;
  reactions?: Record<string, number[]> | null;
  sentAt: string;
  readAt: string | null;
  pending?: boolean;
};

export function isOnline(lastActive?: string | null): boolean {
  return lastActive ? new Date(lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function previewText(m: Conversation["lastMessage"], mine: boolean, t: any): string {
  if (!m) return t("chat.say_hi");
  const prefix = mine ? t("chat.you") : "";
  if (m.payload?.isDeleted) {
    return mine ? t("chat.you_deleted_message") : t("chat.partner_deleted_message", { name: "" }).replace(/^:\s*/, "");
  }
  if (m.type === "image") return `${prefix}${t("chat.photo")}`;
  if (m.type === "schedule") return `${prefix}${t("chat.schedule_invite")}`;
  if (m.type === "call") return m.content;
  return prefix + m.content;
}

export function useChatInbox() {
  const t = useTranslations();
  const locale = useLocale();
  const tDisc = useTranslations("discover");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [me, setMe] = React.useState<{
    id: number;
    avatarUrl?: string | null;
    timezone?: string | null;
    availableSlots?: string[];
  } | null>(null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [connected, setConnected] = React.useState(true);

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const { show: showToast, toast } = useToast();
  const { startCall, busy: callBusy } = useCall();

  const [showEmoji, setShowEmoji] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [translationOpen, setTranslationOpen] = React.useState(false);
  const [translationInitialText, setTranslationInitialText] = React.useState("");
  const [translations, setTranslations] = React.useState<Record<number, string>>({});
  const [showTranslationFor, setShowTranslationFor] = React.useState<Record<number, boolean>>({});
  const [translating, setTranslating] = React.useState<Record<number, boolean>>({});

  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancellingRequestId, setCancellingRequestId] = React.useState<number | null>(null);
  const [cancellingLoading, setCancellingLoading] = React.useState(false);

  const [reactionPickerFor, setReactionPickerFor] = React.useState<number | null>(null);
  const [replyingTo, setReplyingTo] = React.useState<ReplyToInfo | null>(null);
  const [editingMessage, setEditingMessage] = React.useState<Message | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = React.useState<number | null>(null);
  const highlightTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const socketRef = React.useRef<Socket | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectedIdRef = React.useRef<number | null>(null);
  selectedIdRef.current = selectedId;
  const meRef = React.useRef<number>(0);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000";
      router.push("/login", { locale: "en" });
      return;
    }

    api<{ id: number; avatarUrl?: string | null; timezone?: string | null; availableSlots?: string[] }>(
      "/users/me",
    )
      .then(setMe)
      .catch(console.error);

    api<Conversation[]>("/conversations")
      .then((data) => {
        setConversations(data);
        const preselect = searchParams.get("conversation");
        if (preselect) setSelectedId(Number(preselect));
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));

    const socket = getSocket(token);
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNewMessage = (message: Message) => {
      if (Number(message.conversationId) === Number(selectedIdRef.current)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) return prev;
          if (Number(message.senderId) === Number(meRef.current)) {
            const tempIdx = prev.findIndex(
              (m) => m.pending && m.content === message.content && m.type === message.type,
            );
            if (tempIdx === -1) return prev;
            const next = [...prev];
            next[tempIdx] = { ...message, pending: false };
            return next;
          }
          return [...prev, message];
        });
        if (Number(message.senderId) !== Number(meRef.current)) {
          socket.emit("conversation:read", { conversationId: message.conversationId });
        }
      }
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === message.conversationId);
        if (idx === -1) return prev;
        const conv = {
          ...prev[idx],
          lastMessage: {
            content: message.content,
            sentAt: message.sentAt,
            senderId: message.senderId,
            type: message.type,
          },
          unreadCount:
            message.conversationId === selectedIdRef.current || message.senderId === meRef.current
              ? prev[idx].unreadCount
              : prev[idx].unreadCount + 1,
        };
        return [conv, ...prev.filter((c) => c.id !== message.conversationId)];
      });
    };

    const onMessageUpdate = (message: Message) => {
      if (Number(message.conversationId) === Number(selectedIdRef.current)) {
        setMessages((prev) => prev.map((m) => (String(m.id) === String(message.id) ? { ...m, ...message } : m)));
      }
    };

    const onRead = (payload: { conversationId: number; readerId: number }) => {
      if (
        Number(payload.conversationId) === Number(selectedIdRef.current) &&
        Number(payload.readerId) !== Number(meRef.current)
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            Number(m.senderId) === Number(meRef.current) && !m.readAt
              ? { ...m, readAt: new Date().toISOString() }
              : m,
          ),
        );
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onNewMessage);
    socket.on("message:update", onMessageUpdate);
    socket.on("conversation:read", onRead);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onNewMessage);
      socket.off("message:update", onMessageUpdate);
      socket.off("conversation:read", onRead);
    };
  }, []);

  React.useEffect(() => {
    if (me) meRef.current = me.id;
  }, [me]);

  React.useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    setMenuOpen(false);
    setShowEmoji(false);
    setTranslations({});
    setShowTranslationFor({});

    socketRef.current?.emit("conversation:join", { conversationId: selectedId });

    api<Message[]>(`/conversations/${selectedId}/messages`)
      .then((data) => {
        setMessages(data);
        socketRef.current?.emit("conversation:read", { conversationId: selectedId });
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)),
        );
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = React.useCallback(
    (content: string, type: Message["type"], payload?: MessagePayload) => {
      if (!selectedId || !me) return;
      const tempId = -Date.now();
      const temp: Message = {
        id: tempId,
        conversationId: selectedId,
        senderId: me.id,
        type,
        content,
        payload: payload ?? null,
        sentAt: new Date().toISOString(),
        readAt: null,
        pending: true,
      };
      setMessages((prev) => [...prev, temp]);

      socketRef.current?.emit(
        "message:send",
        { conversationId: selectedId, content, type, payload },
        (ack: Message) => {
          setMessages((prev) => {
            if (prev.some((m) => String(m.id) === String(ack.id))) return prev;
            return prev.map((m) => (String(m.id) === String(tempId) ? { ...ack, pending: false } : m));
          });
          setConversations((prev) => {
            const idx = prev.findIndex((c) => String(c.id) === String(selectedId));
            if (idx === -1) return prev;
            const conv = {
              ...prev[idx],
              lastMessage: {
                content: ack.content,
                sentAt: ack.sentAt,
                senderId: ack.senderId,
                type: ack.type,
                payload: ack.payload,
              },
            };
            return [conv, ...prev.filter((c) => String(c.id) !== String(selectedId))];
          });
        },
      );
    },
    [selectedId, me],
  );

  const handleReply = React.useCallback((m: Message) => {
    setEditingMessage(null);
    setReplyingTo({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.senderId === meRef.current ? t("chat.replied_yourself") : (selected?.partner.displayName || "Partner"),
      type: m.type,
    });
    inputRef.current?.focus();
  }, [selected, t]);

  const handleStartEdit = React.useCallback((m: Message) => {
    setReplyingTo(null);
    setEditingMessage(m);
    setDraft(m.content);
    inputRef.current?.focus();
  }, []);

  const handleCancelReplyOrEdit = React.useCallback(() => {
    if (editingMessage) setDraft("");
    setEditingMessage(null);
    setReplyingTo(null);
  }, [editingMessage]);

  const handleDeleteMessage = React.useCallback((messageId: number) => {
    socketRef.current?.emit("message:delete", { messageId });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: "",
              payload: { ...(m.payload as any), isDeleted: true, deletedAt: new Date().toISOString() },
            }
          : m,
      ),
    );
  }, []);

  const scrollToMessage = React.useCallback((id: number) => {
    const el = document.getElementById(`message-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(id);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1500);
    }
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    if (editingMessage) {
      socketRef.current?.emit("message:edit", { messageId: editingMessage.id, content });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id
            ? {
                ...m,
                content,
                payload: { ...(m.payload as any), isEdited: true, editedAt: new Date().toISOString() },
              }
            : m,
        ),
      );
      setEditingMessage(null);
      setDraft("");
      return;
    }

    const payload = replyingTo ? { replyTo: replyingTo } : undefined;
    setDraft("");
    setShowEmoji(false);
    setReplyingTo(null);
    sendMessage(content, "text", payload);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      sendMessage(dataUrl, "image");
    } catch {
      showToast("Không gửi được ảnh này");
    }
  };

  const handleTranslate = async (msg: Message) => {
    if (showTranslationFor[msg.id]) {
      setShowTranslationFor((prev) => ({ ...prev, [msg.id]: false }));
      return;
    }
    if (translations[msg.id]) {
      setShowTranslationFor((prev) => ({ ...prev, [msg.id]: true }));
      return;
    }
    setTranslating((prev) => ({ ...prev, [msg.id]: true }));
    try {
      const res = await api<{ translation: string }>("/translate", {
        method: "POST",
        body: { text: msg.content, source: "auto", target: locale || "en" },
      });
      setTranslations((prev) => ({ ...prev, [msg.id]: res.translation }));
      setShowTranslationFor((prev) => ({ ...prev, [msg.id]: true }));
    } catch {
      showToast(t("chat.translate_fail"));
    } finally {
      setTranslating((prev) => ({ ...prev, [msg.id]: false }));
    }
  };

  const handleSchedule = async (timeUtcIso: string) => {
    if (!selected) return;
    try {
      await api("/schedule", {
        method: "POST",
        body: { conversationId: selected.id, proposedTimeUtc: timeUtcIso },
      });
    } catch (err: any) {
      showToast(err.message || t("chat.schedule_fail"));
    }
  };

  const respondScheduleRequest = async (requestId: number, action: "accept" | "decline") => {
    try {
      await api(`/schedule/${requestId}/respond`, { method: "PATCH", body: { action } });
    } catch (err: any) {
      showToast(err.message || t("chat.respond_fail"));
    }
  };

  const handleCancelSchedule = async (reason: string) => {
    if (!cancellingRequestId) return;
    setCancellingLoading(true);
    try {
      await api(`/schedule/${cancellingRequestId}/cancel`, {
        method: "PATCH",
        body: { reason },
      });
      setCancelDialogOpen(false);
      setCancellingRequestId(null);
    } catch (err: any) {
      showToast(err.message || t("chat.cancel_schedule_fail"));
    } finally {
      setCancellingLoading(false);
    }
  };

  const openCancelDialog = (requestId: number) => {
    setCancellingRequestId(requestId);
    setCancelDialogOpen(true);
  };

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    setReactionPickerFor(null);
    try {
      const res = await api<Message>(`/conversations/messages/${messageId}/reactions`, {
        method: "POST",
        body: { emoji },
      });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m)));
    } catch (err: any) {
      showToast(err.message || t("chat.react_fail"));
    }
  };

  const handleReport = async (reason: string, details?: string) => {
    if (!selected) return;
    try {
      await api("/reports", {
        method: "POST",
        body: { targetUserId: selected.partner.id, reason, details },
      });
      showToast(t("chat.reported_toast", { name: selected.partner.displayName }));
      setReportOpen(false);
    } catch (err: any) {
      showToast(err.message || t("chat.report_fail"));
    }
  };

  const handleBlock = async () => {
    if (!selected) return;
    try {
      await api("/blocks", {
        method: "POST",
        body: { targetUserId: selected.partner.id },
      });
      showToast(t("chat.blocked_toast", { name: selected.partner.displayName }));
      setBlockOpen(false);
      setConversations((prev) => prev.filter((c) => c.id !== selected.id));
      setSelectedId(null);
    } catch (err: any) {
      showToast(err.message || t("chat.block_fail"));
    }
  };

  return {
    t,
    locale,
    tDisc,
    router,
    me,
    conversations,
    loadingList,
    search,
    setSearch,
    selectedId,
    setSelectedId,
    messages,
    loadingMessages,
    draft,
    setDraft,
    connected,
    menuOpen,
    setMenuOpen,
    reportOpen,
    setReportOpen,
    blockOpen,
    setBlockOpen,
    showToast,
    toast,
    startCall,
    callBusy,
    showEmoji,
    setShowEmoji,
    scheduleOpen,
    setScheduleOpen,
    translationOpen,
    setTranslationOpen,
    translationInitialText,
    setTranslationInitialText,
    translations,
    showTranslationFor,
    translating,
    cancelDialogOpen,
    setCancelDialogOpen,
    cancellingLoading,
    handleCancelSchedule,
    openCancelDialog,
    reactionPickerFor,
    setReactionPickerFor,
    replyingTo,
    editingMessage,
    highlightedMsgId,
    socketRef,
    bottomRef,
    messagesContainerRef,
    fileInputRef,
    inputRef,
    selected,
    handleSend,
    handleImageUpload,
    handleTranslate,
    handleSchedule,
    respondScheduleRequest,
    handleToggleReaction,
    handleReply,
    handleStartEdit,
    handleCancelReplyOrEdit,
    handleDeleteMessage,
    scrollToMessage,
    handleReport,
    handleBlock,
  };
}
