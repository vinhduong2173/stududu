"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Socket } from "socket.io-client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  Flag,
  Globe,
  Image as ImageIcon,
  Languages,
  MoreHorizontal,
  Search,
  Send,
  ShieldBan,
  Smile,
  UserRound,
  X,
} from "lucide-react";
import { ReportDialog, BlockDialog, useToast } from "@/components/features/TrustDialogs";
import { EmojiPicker } from "@/components/features/EmojiPicker";
import { WordSaveModal } from "@/components/features/WordSaveModal";
import { TranslationModal } from "@/components/features/TranslationModal";
import { ScheduleChatModal } from "@/components/features/ScheduleChatModal";
import {
  TIME_SLOTS,
  convertSlot,
  currentTimeAt,
  getTimezone,
  slotsOverlap,
} from "@/lib/timezones";
import { cn, compressImage } from "@/lib/utils";

// FS-14 — tập emoji reaction cố định (khớp REACTION_EMOJIS backend)
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"] as const;

/** MÀN 10 + 11 — Inbox & Chat 1:1 (US-14–16) + tính năng bản Figma Make:
 *  emoji · gửi ảnh · dịch tin nhắn · bảng dịch · lưu từ vựng · hẹn giờ theo múi giờ. */

type Partner = {
  id: number;
  displayName: string;
  avatarUrl?: string | null;
  lastActive?: string | null;
  timezone?: string | null;
  availableSlots?: string[];
};
type SchedulePayload = {
  // FS-28 (mới): giờ hẹn cụ thể lưu UTC
  requestId?: number;
  timeUtc?: string;
  // bản cũ theo khung giờ — giữ để render tin nhắn lịch sử
  slotId?: string;
  myTimeLabel?: string;
  partnerTimeLabel?: string;
  status: "pending" | "accepted" | "declined" | "expired";
};
type Conversation = {
  id: number;
  partner: Partner;
  lastMessage: { content: string; sentAt: string; senderId: number; type?: string } | null;
  unreadCount: number;
  createdAt: string;
};
type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  type: "text" | "image" | "schedule";
  content: string;
  payload?: SchedulePayload | null;
  reactions?: Record<string, number[]> | null; // FS-14: { emoji: [userId] }
  sentAt: string;
  readAt: string | null;
  pending?: boolean;
};

function isOnline(lastActive?: string | null): boolean {
  return lastActive ? new Date(lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function previewText(m: Conversation["lastMessage"], mine: boolean): string {
  if (!m) return "Hãy gửi lời chào đầu tiên 👋";
  const prefix = mine ? "Bạn: " : "";
  if (m.type === "image") return `${prefix}📷 Ảnh`;
  if (m.type === "schedule") return `${prefix}📅 Lời mời hẹn giờ`;
  return prefix + m.content;
}


export default function InboxPage() {
  return (
    <React.Suspense>
      <InboxContent />
    </React.Suspense>
  );
}

function InboxContent() {
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

  // Tính năng Figma Make
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [translationOpen, setTranslationOpen] = React.useState(false);
  const [translationInitialText, setTranslationInitialText] = React.useState("");
  const [wordSaveTarget, setWordSaveTarget] = React.useState<string | null>(null);
  const [translations, setTranslations] = React.useState<Record<number, string>>({});
  const [showTranslationFor, setShowTranslationFor] = React.useState<Record<number, boolean>>({});
  const [translating, setTranslating] = React.useState<Record<number, boolean>>({});

  // FS-14: nút lưu từ nổi khi bôi đen văn bản trong tin nhắn
  const [selectionSave, setSelectionSave] = React.useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);
  // FS-14: message đang mở reaction picker
  const [reactionPickerFor, setReactionPickerFor] = React.useState<number | null>(null);

  const socketRef = React.useRef<Socket | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectedIdRef = React.useRef<number | null>(null);
  selectedIdRef.current = selectedId;
  const meRef = React.useRef<number>(0);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // ----- Load dữ liệu ban đầu + kết nối socket -----
  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
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
          // Đã có bản thật (ack về trước) → bỏ qua
          if (prev.some((m) => String(m.id) === String(message.id))) return prev;
          // Tin của chính mình: thay bản optimistic tương ứng thay vì thêm mới
          // (chống trùng khi message:new về trước ack, hoặc ack bị mất)
          if (Number(message.senderId) === Number(meRef.current)) {
            const tempIdx = prev.findIndex(
              (m) => m.pending && m.content === message.content && m.type === message.type,
            );
            if (tempIdx === -1) return prev; // ack sẽ xử lý (hoặc đã xử lý) — không thêm
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

    // Lời mời hẹn giờ được phản hồi → cập nhật bubble
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (me) meRef.current = me.id;
  }, [me]);

  // ----- Mở một hội thoại -----
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

  // ----- Gửi tin -----
  const sendMessage = React.useCallback(
    (content: string, type: Message["type"], payload?: SchedulePayload) => {
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
          // Lọc bản trùng (nếu message:new đã kịp thêm) rồi thay tin optimistic bằng bản thật
          setMessages((prev) =>
            prev
              .filter((m) => String(m.id) !== String(ack.id))
              .map((m) => (String(m.id) === String(tempId) ? { ...ack, pending: false } : m)),
          );
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
              },
            };
            return [conv, ...prev.filter((c) => String(c.id) !== String(selectedId))];
          });
        },
      );
    },
    [selectedId, me],
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    setShowEmoji(false);
    sendMessage(content, "text");
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

  // ----- Dịch inline từng tin nhắn -----
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
        body: { text: msg.content, source: "auto", target: "vi" },
      });
      setTranslations((prev) => ({ ...prev, [msg.id]: res.translation }));
      setShowTranslationFor((prev) => ({ ...prev, [msg.id]: true }));
    } catch {
      showToast("Dịch thất bại, thử lại sau");
    } finally {
      setTranslating((prev) => ({ ...prev, [msg.id]: false }));
    }
  };

  // ----- Hẹn giờ -----
  // FS-28 — tạo SCHEDULE_REQUEST (giờ hẹn cụ thể, lưu UTC); backend tự bắn message realtime
  const handleSchedule = async (timeUtcIso: string) => {
    if (!selected) return;
    try {
      await api("/schedule", {
        method: "POST",
        body: { conversationId: selected.id, proposedTimeUtc: timeUtcIso },
      });
    } catch (err: any) {
      showToast(err.message || "Không gửi được lời mời hẹn");
    }
  };

  // FS-28 — phản hồi qua REST; message:update sẽ về qua socket cho cả 2 phía
  const respondScheduleRequest = async (requestId: number, action: "accept" | "decline") => {
    try {
      await api(`/schedule/${requestId}/respond`, { method: "PATCH", body: { action } });
    } catch (err: any) {
      showToast(err.message || "Không phản hồi được lời mời");
    }
  };

  // Lời mời kiểu cũ (theo khung giờ) — giữ để tương thích tin nhắn lịch sử
  const respondLegacySchedule = (messageId: number, response: "accepted" | "declined") => {
    socketRef.current?.emit("schedule:respond", { messageId, response }, (updated: Message) => {
      setMessages((prev) =>
        prev.map((m) => (String(m.id) === String(updated.id) ? { ...m, ...updated } : m)),
      );
    });
  };

  // FS-14 — toggle reaction (tập emoji cố định); message:update về qua socket
  const toggleReaction = (messageId: number, emoji: string) => {
    socketRef.current?.emit("message:react", { messageId, emoji }, (updated: Message) => {
      setMessages((prev) =>
        prev.map((m) => (String(m.id) === String(updated.id) ? { ...m, ...updated } : m)),
      );
    });
  };

  // FS-14 — bôi đen từ trong tin nhắn → nút "Lưu từ vựng" nổi tại vị trí chọn
  const handleTextSelection = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!text || text.length > 100 || !sel?.rangeCount) {
      setSelectionSave(null);
      return;
    }
    const container = messagesContainerRef.current;
    const range = sel.getRangeAt(0);
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelectionSave(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setSelectionSave({
      text,
      top: rect.top - containerRect.top + container.scrollTop - 38,
      left: Math.max(8, rect.left - containerRect.left + rect.width / 2 - 50),
    });
  };

  const filtered = conversations.filter((c) =>
    c.partner.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  // Múi giờ & khung giờ chung với đối tác đang chọn
  const myTz = getTimezone(me?.timezone);
  const partnerTz = selected ? getTimezone(selected.partner.timezone) : null;
  const mySlots = TIME_SLOTS.filter((s) => (me?.availableSlots ?? []).includes(s.id));
  const partnerSlots = selected
    ? TIME_SLOTS.filter((s) => (selected.partner.availableSlots ?? []).includes(s.id))
    : [];
  const hasOverlap =
    partnerTz !== null &&
    mySlots.some((ms) => partnerSlots.some((ps) => slotsOverlap(ms, myTz.offset, ps, partnerTz.offset)));

  // ================= RENDER =================

  const listPane = (
    <div
      className={cn(
        "flex flex-col h-full w-full md:w-80 lg:w-96 md:border-r md:border-border",
        selectedId && "hidden md:flex",
      )}
    >
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-3">Tin nhắn</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            className="w-full h-10 rounded-xl border border-border bg-transparent pl-9 pr-3 text-sm outline-none focus:border-primary"
            placeholder="Tìm hội thoại…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadingList ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-muted/20" />
                  <div className="h-3 w-3/4 rounded bg-muted/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-semibold text-foreground mb-2">
              {search ? "Không tìm thấy hội thoại" : "Chưa có cuộc trò chuyện nào"}
            </p>
            {!search && (
              <>
                <p className="text-sm text-muted mb-6">
                  Vào Khám phá để tìm đối tác luyện tập cùng bạn nhé.
                </p>
                <Button size="sm" onClick={() => router.push("/discover")}>
                  Đi tới Khám phá
                </Button>
              </>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/5",
                c.id === selectedId && "bg-primary/5",
              )}
              onClick={() => setSelectedId(c.id)}
            >
              <Avatar
                src={c.partner.avatarUrl ?? undefined}
                fallback={c.partner.displayName.charAt(0)}
                online={isOnline(c.partner.lastActive)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "font-semibold text-foreground truncate",
                      c.unreadCount > 0 && "font-bold",
                    )}
                  >
                    {c.partner.displayName}
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {c.lastMessage ? formatTime(c.lastMessage.sentAt) : formatTime(c.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted",
                    )}
                  >
                    {previewText(c.lastMessage, c.lastMessage?.senderId === me?.id)}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const chatPane = !selected ? (
    <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
      <div>
        <div className="text-6xl mb-4">👋</div>
        <p className="text-lg font-semibold text-foreground">Chọn một hội thoại</p>
        <p className="text-sm text-muted mt-1">Bắt đầu luyện tập với đối tác của bạn.</p>
      </div>
    </div>
  ) : (
    <div className={cn("flex flex-col h-full flex-1 min-w-0", !selectedId && "hidden md:flex")}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
        <button
          className="md:hidden p-2 -ml-2 hover:bg-muted/10 rounded-full"
          onClick={() => setSelectedId(null)}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <Link
          href={`/profile/${selected.partner.id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Avatar
            src={selected.partner.avatarUrl ?? undefined}
            fallback={selected.partner.displayName.charAt(0)}
            online={isOnline(selected.partner.lastActive)}
            size="sm"
          />
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{selected.partner.displayName}</p>
            <p className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
              <span>
                {isOnline(selected.partner.lastActive) ? "Đang hoạt động" : "Hoạt động gần đây"}
              </span>
              {partnerTz && (
                <span className="hidden sm:inline-flex items-center gap-1">
                  · <Globe className="w-3 h-3" /> {partnerTz.flag} {currentTimeAt(partnerTz.offset)} ={" "}
                  {myTz.flag} {currentTimeAt(myTz.offset)} (giờ bạn)
                </span>
              )}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScheduleOpen(true)}
            className="p-2 text-muted hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
            title="Hẹn giờ trò chuyện"
          >
            <CalendarClock className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setTranslationInitialText("");
              setTranslationOpen(true);
            }}
            className="p-2 text-muted hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
            title="Bảng dịch"
          >
            <Languages className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              className="p-2 hover:bg-muted/10 rounded-full transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-5 w-5 text-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-border bg-surface shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href={`/profile/${selected.partner.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                  >
                    <UserRound className="h-4 w-4 text-muted" /> Xem hồ sơ
                  </Link>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                  >
                    <Flag className="h-4 w-4 text-warning" /> Báo cáo
                  </button>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5"
                    onClick={() => {
                      setMenuOpen(false);
                      setBlockOpen(true);
                    }}
                  >
                    <ShieldBan className="h-4 w-4" /> Chặn
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dải múi giờ + khung giờ rảnh của đối tác */}
      {partnerTz && partnerSlots.length > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs text-muted flex items-center gap-2 flex-wrap">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Lịch rảnh của {selected.partner.displayName}:{" "}
            {partnerSlots.map((s, i) => (
              <span key={s.id} className="font-semibold text-foreground">
                {i > 0 && ", "}
                {s.label} ({partnerTz.flag}) = {convertSlot(s, partnerTz.offset, myTz.offset)} (giờ bạn)
              </span>
            ))}
          </span>
          {hasOverlap && (
            <span className="ml-auto font-bold text-success bg-success/10 rounded-full px-2 py-0.5 text-[10px] shrink-0">
              ✓ Có khung giờ chung!
            </span>
          )}
        </div>
      )}

      {/* Banner mất kết nối */}
      {!connected && (
        <div className="bg-warning/10 text-warning text-xs font-medium text-center py-1.5">
          Đang kết nối lại…
        </div>
      )}

      {/* Khung tin nhắn — onMouseUp bắt bôi đen từ để lưu (FS-14) */}
      <div
        ref={messagesContainerRef}
        onMouseUp={handleTextSelection}
        className="relative flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-background"
      >
        {selectionSave && (
          <button
            className="absolute z-30 flex items-center gap-1 rounded-full bg-foreground text-background text-xs font-semibold px-3 py-1.5 shadow-xl hover:scale-105 transition-transform"
            style={{ top: selectionSave.top, left: selectionSave.left }}
            onMouseDown={(e) => {
              e.preventDefault();
              setWordSaveTarget(selectionSave.text);
              setSelectionSave(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <BookOpen className="w-3.5 h-3.5" /> Lưu từ vựng
          </button>
        )}
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-semibold text-foreground">Các bạn đã match!</p>
            <p className="text-sm text-muted mt-1">Gửi lời chào để bắt đầu luyện tập nhé.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === me?.id;
            const isLastMine = mine && i === messages.length - 1;

            // Bubble lời mời hẹn giờ (FS-28: giờ cụ thể UTC → hiển thị theo timezone trình duyệt)
            if (m.type === "schedule" && m.payload) {
              const sd = m.payload;
              const isNewShape = Boolean(sd.requestId && sd.timeUtc);
              const localTime = sd.timeUtc
                ? new Date(sd.timeUtc).toLocaleString(undefined, {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null;
              return (
                <div key={m.id} className="flex justify-center">
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl border-2 p-4 shadow-sm",
                      sd.status === "expired"
                        ? "border-border bg-muted/5"
                        : "border-success/40 bg-success/5",
                      m.pending && "opacity-60",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarClock className="w-4 h-4 text-success shrink-0" />
                      <span className="text-xs font-bold text-foreground">
                        {mine
                          ? "Bạn đã gửi lời mời hẹn"
                          : `${selected.partner.displayName} mời bạn trò chuyện`}
                      </span>
                    </div>
                    {isNewShape ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">🕐 {localTime}</p>
                        <p className="text-[11px] text-muted mt-0.5">(theo múi giờ trên máy của bạn)</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">{sd.myTimeLabel}</p>
                        <p className="text-xs text-muted mt-0.5">{sd.partnerTimeLabel}</p>
                      </>
                    )}
                    {!mine && sd.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() =>
                            isNewShape
                              ? respondScheduleRequest(sd.requestId!, "accept")
                              : respondLegacySchedule(m.id, "accepted")
                          }
                          className="flex-1 rounded-full py-2 px-3 text-xs font-bold bg-success text-white hover:bg-success/90 transition-colors"
                        >
                          <Check className="w-3 h-3 inline mr-1" /> Đồng ý
                        </button>
                        <button
                          onClick={() =>
                            isNewShape
                              ? respondScheduleRequest(sd.requestId!, "decline")
                              : respondLegacySchedule(m.id, "declined")
                          }
                          className="flex-1 rounded-full py-2 px-3 text-xs font-bold border border-border text-muted hover:text-error hover:border-error/40 transition-colors"
                        >
                          <X className="w-3 h-3 inline mr-1" /> Từ chối
                        </button>
                      </div>
                    )}
                    {sd.status !== "pending" && (
                      <p
                        className={cn(
                          "text-xs font-bold mt-2",
                          sd.status === "accepted"
                            ? "text-success"
                            : sd.status === "expired"
                              ? "text-muted"
                              : "text-error",
                        )}
                      >
                        {sd.status === "accepted"
                          ? "✅ Đã đồng ý — sẽ nhắc trước 30 phút"
                          : sd.status === "expired"
                            ? "⌛ Hết hạn (không phản hồi trong 48h)"
                            : "❌ Đã từ chối"}
                      </p>
                    )}
                    <p className="text-[10px] text-muted mt-2">{formatBubbleTime(m.sentAt)}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={cn("flex group", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[75%]">
                  {m.type === "image" ? (
                    <div
                      className={cn(
                        "rounded-2xl overflow-hidden shadow-sm border border-border",
                        mine ? "rounded-br-md" : "rounded-bl-md",
                        m.pending && "opacity-60",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.content} alt="Ảnh gửi" className="max-w-full max-h-64 object-cover block" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
                        mine
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-surface border border-border text-foreground rounded-bl-md",
                        m.pending && "opacity-60",
                      )}
                    >
                      {m.content}
                    </div>
                  )}

                  {/* FS-14 — reactions đã có trên tin nhắn */}
                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <div className={cn("flex flex-wrap gap-1 mt-1", mine ? "justify-end" : "justify-start")}>
                      {Object.entries(m.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(m.id, emoji)}
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all",
                            userIds.includes(me?.id ?? -1)
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border bg-surface text-muted hover:border-primary/40",
                          )}
                        >
                          {emoji} {userIds.length}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bản dịch inline */}
                  {showTranslationFor[m.id] && translations[m.id] && (
                    <div className="mt-1.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 text-xs text-foreground">
                      <span className="font-medium text-primary mr-1">🌐</span>
                      {translations[m.id]}
                    </div>
                  )}

                  <div
                    className={cn(
                      "mt-1 text-[11px] text-muted flex gap-1 items-center",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <span>{formatBubbleTime(m.sentAt)}</span>
                    {isLastMine && (
                      <span>· {m.pending ? "Đang gửi…" : m.readAt ? "Đã đọc" : "Đã gửi"}</span>
                    )}
                  </div>

                  {/* Thanh hành động: reaction cho mọi tin đã gửi + dịch/lưu từ cho tin đối tác */}
                  {!m.pending && (
                    <div
                      className={cn(
                        "relative flex items-center gap-1 mt-1 transition-opacity duration-200",
                        reactionPickerFor === m.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                        mine && "justify-end",
                      )}
                    >
                      {/* FS-14 — reaction picker (tập emoji cố định) */}
                      <button
                        onClick={() => setReactionPickerFor(reactionPickerFor === m.id ? null : m.id)}
                        className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-surface border border-border text-muted hover:border-primary hover:text-primary transition-all"
                        title="Thả cảm xúc"
                      >
                        😊+
                      </button>
                      {reactionPickerFor === m.id && (
                        <div
                          className={cn(
                            "absolute bottom-8 z-30 flex gap-1 rounded-full bg-surface border border-border shadow-xl px-2 py-1.5",
                            mine ? "right-0" : "left-0",
                          )}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                toggleReaction(m.id, emoji);
                                setReactionPickerFor(null);
                              }}
                              className="text-lg hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      {!mine && m.type === "text" && (
                        <>
                          <button
                            onClick={() => void handleTranslate(m)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 border transition-all",
                              showTranslationFor[m.id]
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-surface border-border text-muted hover:border-primary hover:text-primary",
                            )}
                          >
                            <Globe className="w-3 h-3" />
                            {translating[m.id] ? "Đang dịch…" : showTranslationFor[m.id] ? "Ẩn" : "Dịch"}
                          </button>
                          <button
                            onClick={() => setWordSaveTarget(m.content)}
                            className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-surface border border-border text-muted hover:border-success hover:text-success transition-all"
                          >
                            <BookOpen className="w-3 h-3" /> Lưu từ
                          </button>
                          <button
                            onClick={() => {
                              setTranslationInitialText(m.content);
                              setTranslationOpen(true);
                            }}
                            className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-surface border border-border text-muted hover:border-primary hover:text-primary transition-all"
                          >
                            <Languages className="w-3 h-3" /> Bảng dịch
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ô soạn tin */}
      <div className="relative border-t border-border bg-surface px-4 py-3">
        {showEmoji && (
          <div className="absolute bottom-[64px] left-4 z-40">
            <EmojiPicker
              onSelect={(emoji) => {
                setDraft((prev) => prev + emoji);
                inputRef.current?.focus();
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
              showEmoji ? "bg-primary/10 text-primary" : "text-muted hover:text-primary hover:bg-primary/10",
            )}
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-all shrink-0"
            title="Gửi ảnh"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleImageUpload(e)}
          />
          <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 h-11 rounded-full border border-border bg-background px-4 text-[15px] outline-none focus:border-primary"
              placeholder="Nhập tin nhắn…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setShowEmoji(false)}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-11 w-11 shrink-0"
              disabled={!draft.trim() || !connected}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {listPane}
      {chatPane}

      {selected && (
        <>
          <ReportDialog
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            targetId={selected.partner.id}
            targetName={selected.partner.displayName}
            onDone={() => showToast("Đã gửi báo cáo. Cảm ơn bạn!")}
          />
          <BlockDialog
            open={blockOpen}
            onClose={() => setBlockOpen(false)}
            targetId={selected.partner.id}
            targetName={selected.partner.displayName}
            onDone={() => {
              showToast(`Đã chặn ${selected.partner.displayName}`);
              setConversations((prev) => prev.filter((c) => c.id !== selected.id));
              setSelectedId(null);
            }}
          />
          <ScheduleChatModal
            open={scheduleOpen}
            onClose={() => setScheduleOpen(false)}
            myOffset={myTz.offset}
            partnerSlotIds={selected.partner.availableSlots ?? []}
            partnerOffset={(partnerTz ?? myTz).offset}
            partnerName={selected.partner.displayName}
            partnerFlag={(partnerTz ?? myTz).flag}
            onSchedule={handleSchedule}
          />
          <TranslationModal
            open={translationOpen}
            onClose={() => {
              setTranslationOpen(false);
              setTranslationInitialText("");
            }}
            initialText={translationInitialText}
          />
          <WordSaveModal
            open={wordSaveTarget !== null}
            onClose={() => setWordSaveTarget(null)}
            initialWord={wordSaveTarget ?? ""}
            source="chat"
            onSaved={(item, duplicated) =>
              showToast(
                duplicated
                  ? `"${item.word.term}" đã có trong sổ của bạn`
                  : `✅ Đã lưu "${item.word.term}" vào Sổ từ vựng`,
              )
            }
          />
        </>
      )}
      {toast}
    </div>
  );
}
