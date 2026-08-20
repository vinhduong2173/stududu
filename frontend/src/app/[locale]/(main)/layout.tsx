"use client";

import * as React from "react";
import { Bell, BookOpen, Compass, LogOut, MessageCircle, Settings, Sparkles, User, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/features/TrustDialogs";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { TextSelectionPopup } from "@/components/features/TextSelectionPopup";
import { Logo } from "@/components/ui/Logo";
import { CallProvider } from "@/components/call/CallProvider";
import { ProNavButton } from "@/components/features/pricing/ProNavButton";

import { NotificationDropdown, getNotificationMessage } from "@/components/layout/NotificationDropdown";

/** CallProvider bọc toàn bộ khu vực đã đăng nhập để chuông đổ được ở mọi trang,
 *  không chỉ khi đang mở Inbox (audio-call-design.md mục 3). */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CallProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </CallProvider>
  );
}

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = React.useState<any>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<{ id: number; displayName: string; avatarUrl?: string | null; role?: string; nativeLang?: string | null }>("/users/me")
      .then(setMe)
      .catch(() => {
        router.push("/login");
      });

    api<any[]>("/notifications")
      .then(setNotifications)
      .catch(console.error);

    // Fetch unread messages count
    api<{ count: number }>("/conversations/unread-count")
      .then((res) => setUnreadMessagesCount(res.count))
      .catch(() => {
        api<any[]>("/conversations")
          .then((convs) => {
            const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setUnreadMessagesCount(total);
          })
          .catch(console.error);
      });

    // FS-28 — in-app notification qua Socket.IO
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = getSocket(token);
    const onNotification = (n: any) => {
      const msg = getNotificationMessage(n, t);
      if (n.type === "schedule_reminder" && n.timeUtc) {
        const local = new Date(n.timeUtc).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });
        showToast(`${msg} (${local})`);
      } else {
        showToast(msg);
      }
      setNotifications((prev) => [n, ...prev]);
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, locale]);

  // Reset unread message indicator when navigating to /inbox
  React.useEffect(() => {
    if (pathname.startsWith("/inbox")) {
      setUnreadMessagesCount(0);
    }
  }, [pathname]);

  // Listen to real-time chat messages for the red dot indicator
  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = getSocket(token);

    const onNewMessage = (msg: any) => {
      if (me && msg.senderId !== me.id && !pathname.startsWith("/inbox")) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    };

    const onUnreadNotice = () => {
      if (!pathname.startsWith("/inbox")) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    };

    socket.on("message:new", onNewMessage);
    socket.on("chat:unread_notice", onUnreadNotice);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("chat:unread_notice", onUnreadNotice);
    };
  }, [me, pathname]);

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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    disconnectSocket();
    router.push("/login");
  };

  const navItems = [
    { name: t("nav.community"), href: "/community", icon: Users },
    { name: t("nav.discover"), href: "/discover", icon: Compass },
    { name: t("nav.messages"), href: "/inbox", icon: MessageCircle, hasUnread: unreadMessagesCount > 0 },
    { name: t("nav.vocabulary"), href: "/vocabulary", icon: BookOpen },
    { name: t("nav.profile"), href: "/profile/me", icon: User },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Desktop Top Nav */}
      <header className="hidden md:flex h-16 items-center justify-between app-header px-8 sticky top-0 z-30 transition-colors">
        <Logo size="md" href="/discover" />
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full transition-all duration-150",
                  isActive 
                    ? "bg-white text-teal-900 shadow-xs border border-slate-200/60" 
                    : "text-muted hover:text-foreground"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className={cn("h-4 w-4", isActive ? "text-teal-600" : "text-slate-400")} />
                  {item.hasUnread && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
                    </span>
                  )}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {/* EP-11 — lối vào gói Pro */}
          <ProNavButton />
          <LanguageSwitcher />
          
          <NotificationDropdown
            notifications={notifications}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            onCloseOtherMenus={() => setMenuOpen(false)}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNotificationClick={handleNotificationClick}
            t={t}
            locale={locale}
          />

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
                    href="/pricing"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Sparkles className="h-4 w-4 text-muted" /> {t("nav.pricing")}
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
          targetLang={
            me?.languages?.find((l: any) => l.role === "native")?.language?.code ||
            me?.nativeLang ||
            locale ||
            "en"
          }
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
              <div className="relative">
                <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
                {item.hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
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
