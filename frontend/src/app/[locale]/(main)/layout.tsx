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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = React.useState<{ displayName: string; avatarUrl?: string | null; role?: string; nativeLang?: string | null } | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<{ displayName: string; avatarUrl?: string | null; role?: string; nativeLang?: string | null }>("/users/me")
      .then(setMe)
      .catch(() => router.push("/login"));

    api<any[]>("/notifications")
      .then(setNotifications)
      .catch(console.error);

    // FS-28 — in-app notification (nhắc lịch hẹn trước 30 phút) qua Socket.IO
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = getSocket(token);
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
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
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
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
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
      {toast}

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden flex h-16 border-t border-border bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.03)] pb-safe">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
