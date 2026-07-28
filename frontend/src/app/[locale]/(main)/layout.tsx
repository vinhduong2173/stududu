"use client";

import * as React from "react";
import { Bell, BookOpen, Compass, LogOut, MessageCircle, Settings, User, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/features/TrustDialogs";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { TextSelectionPopup } from "@/components/features/TextSelectionPopup";
import { Logo } from "@/components/ui/Logo";
import { VideoCallModal, type CallInfo } from "@/components/features/VideoCallModal";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = React.useState<{ id?: number; displayName: string; avatarUrl?: string | null; role?: string; nativeLang?: string | null } | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { show: showToast, toast } = useToast();

  // Global Video Call states
  const [videoCallOpen, setVideoCallOpen] = React.useState(false);
  const [isIncomingCall, setIsIncomingCall] = React.useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = React.useState<CallInfo | null>(null);
  const [outgoingCallInfo, setOutgoingCallInfo] = React.useState<{
    conversationId: number;
    partner: { id: number; displayName: string; avatarUrl?: string | null };
  } | null>(null);

  const socketRef = React.useRef<any>(null);
  const videoCallOpenRef = React.useRef(videoCallOpen);
  videoCallOpenRef.current = videoCallOpen;

  // Unread messages count state
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
  const meRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (me?.id) meRef.current = me.id;
  }, [me]);

  const fetchUnreadMessages = React.useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    api<any[]>("/conversations")
      .then((convs) => {
        const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(total);
      })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetchUnreadMessages();
  }, [pathname, fetchUnreadMessages]);

  React.useEffect(() => {
    api<{ id?: number; displayName: string; avatarUrl?: string | null; role?: string; nativeLang?: string | null }>("/users/me")
      .then(setMe)
      .catch(() => router.push("/login"));

    api<any[]>("/notifications")
      .then(setNotifications)
      .catch(console.error);

    // FS-28 — in-app notification (nhắc lịch hẹn trước 30 phút) & Video call qua Socket.IO
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    const onNotification = (n: any) => {
      if (n.type === "schedule_reminder" && n.timeUtc) {
        const local = new Date(n.timeUtc).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        showToast(`⏰ ${n.message} (${local})`);
      } else {
        showToast(n.message);
      }
      setNotifications((prev) => [n, ...prev]);
    };

    const onIncomingCall = (data: CallInfo) => {
      if (videoCallOpenRef.current) {
        socket.emit("call:reject", {
          conversationId: data.conversationId,
          targetUserId: data.callerId,
          reason: "busy",
        });
        return;
      }
      setIncomingCallInfo(data);
      setIsIncomingCall(true);
      setOutgoingCallInfo(null);
      setVideoCallOpen(true);
    };

    const onNewMessageGlobal = (msg: any) => {
      if (Number(msg.senderId) !== Number(meRef.current)) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    };

    const onReadGlobal = () => {
      fetchUnreadMessages();
    };

    socket.on("notification", onNotification);
    socket.on("call:incoming", onIncomingCall);
    socket.on("message:new", onNewMessageGlobal);
    socket.on("conversation:read", onReadGlobal);

    const handleStartCallEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.partner) {
        setIncomingCallInfo(null);
        setIsIncomingCall(false);
        setOutgoingCallInfo({
          conversationId: detail.conversationId,
          partner: detail.partner,
        });
        setVideoCallOpen(true);
      }
    };
    window.addEventListener("start-video-call", handleStartCallEvent);

    return () => {
      socket.off("notification", onNotification);
      socket.off("call:incoming", onIncomingCall);
      socket.off("message:new", onNewMessageGlobal);
      socket.off("conversation:read", onReadGlobal);
      window.removeEventListener("start-video-call", handleStartCallEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    try {
      await api("/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    try {
      if (!n.read) {
        await api(`/notifications/${n.id}/read`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
      }
      setNotificationsOpen(false);
      if (n.type === "follow" || n.type === "like" || n.type === "match") {
        router.push(`/profile/${n.senderId}`);
      } else if (n.type === "new_post") {
        router.push("/community");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (iso: string) => {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (isNaN(diffMin) || diffMin < 1) return t("community.time_just_now");
    if (diffMin < 60) return t("community.time_minutes_ago", { count: diffMin });
    const h = Math.floor(diffMin / 60);
    if (h < 24) return t("community.time_hours_ago", { count: h });
    return new Date(iso).toLocaleDateString(pathname.startsWith("/en") ? "en-US" : "vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    disconnectSocket();
    router.push("/login");
  };

  const navItems = [
    { name: t("nav.community"), href: "/community", icon: Users },
    { name: t("nav.discover"), href: "/discover", icon: Compass },
    { name: t("nav.messages"), href: "/inbox", icon: MessageCircle },
    { name: t("nav.vocabulary"), href: "/vocabulary", icon: BookOpen },
    { name: t("nav.profile"), href: "/profile/me", icon: User },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Desktop Top Nav */}
      <header className="hidden md:flex h-16 items-center justify-between border-b border-border bg-surface px-8 shadow-sm">
        <Logo size="md" href="/discover" />
        <nav className="flex gap-8">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const isMessages = item.href === "/inbox";
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary relative",
                  isActive ? "text-primary" : "text-muted"
                )}
              >
                <div className="relative flex items-center">
                  <item.icon className="h-5 w-5" />
                  {isMessages && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-surface animate-in zoom-in duration-200">
                      {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                    </span>
                  )}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen((v) => !v);
                setMenuOpen(false);
              }}
              className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-muted/10 focus-visible:outline-none"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-surface">
                  {unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-border bg-surface shadow-xl py-3 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-border mb-2">
                    <span className="font-bold text-sm text-foreground">{t("notifications.title")}</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        {t("notifications.mark_all_read")}
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted">
                      {t("notifications.empty")}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "w-full flex items-start gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-muted/10",
                            !n.read && "bg-primary/5 font-medium"
                          )}
                        >
                          <Avatar
                            src={n.sender?.avatarUrl ?? undefined}
                            fallback={n.sender?.displayName?.charAt(0) ?? "?"}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground leading-relaxed break-words">
                              {n.type === "follow"
                                ? t("notifications.follow_message", { name: n.sender?.displayName || "Ai đó" })
                                : n.type === "new_post"
                                ? t("notifications.new_post_message", { name: n.sender?.displayName || "Ai đó" })
                                : n.type === "like"
                                ? t("notifications.like_message", { name: n.sender?.displayName || "Ai đó" })
                                : n.type === "match"
                                ? t("notifications.match_message", { name: n.sender?.displayName || "Ai đó" })
                                : n.message}
                            </p>
                            <span className="text-[10px] text-muted mt-1 block">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          {!n.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative">
          <button onClick={() => { setMenuOpen((v) => !v); setNotificationsOpen(false); }} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Avatar
              src={me?.avatarUrl ?? undefined}
              fallback={me?.displayName?.charAt(0) ?? "?"}
              size="sm"
            />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-52 rounded-2xl border border-border bg-surface shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
                {me && (
                  <div className="px-4 py-2 border-b border-border mb-1">
                    <p className="font-semibold text-foreground truncate">{me.displayName}</p>
                  </div>
                )}
                <Link
                  href="/profile/me"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserRound className="h-4 w-4 text-muted" /> {t("menu.profile")}
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-muted" /> {t("menu.settings")}
                </Link>
                {me?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Compass className="h-4 w-4 text-muted" /> {t("menu.admin")}
                  </Link>
                )}
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" /> {t("menu.logout")}
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background relative">
        {children}
        <TextSelectionPopup
          targetLang={me?.nativeLang ?? "vi"}
          onWordSaved={(item, dup) => showToast(dup ? t("vocabulary.save_exists", { term: item.word.term }) : t("vocabulary.save_success", { term: item.word.term }))}
        />
      </main>
      <VideoCallModal
        isOpen={videoCallOpen}
        onClose={() => {
          setVideoCallOpen(false);
          setIsIncomingCall(false);
          setIncomingCallInfo(null);
          setOutgoingCallInfo(null);
        }}
        socket={socketRef.current}
        conversationId={incomingCallInfo?.conversationId ?? outgoingCallInfo?.conversationId ?? null}
        partner={
          incomingCallInfo
            ? {
                id: incomingCallInfo.callerId,
                displayName: incomingCallInfo.callerName,
                avatarUrl: incomingCallInfo.callerAvatar,
              }
            : (outgoingCallInfo?.partner ?? null)
        }
        currentUser={{ id: me?.id ?? 0, displayName: me?.displayName }}
        isIncoming={isIncomingCall}
        incomingCallInfo={incomingCallInfo}
      />
      {toast}

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden flex h-16 border-t border-border bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.03)] pb-safe">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isMessages = item.href === "/inbox";
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              <div className="relative flex items-center justify-center">
                <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
                {isMessages && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-surface animate-in zoom-in duration-200">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
