"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, LogOut, MessageCircle, Settings, User, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/features/TrustDialogs";
import { useLocale } from "@/lib/i18n";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = React.useState<{ displayName: string; avatarUrl?: string | null; role?: string } | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<{ displayName: string; avatarUrl?: string | null; role?: string }>("/users/me")
      .then(setMe)
      .catch(() => router.push("/login"));

    // FS-28 — in-app notification (nhắc lịch hẹn trước 30 phút) qua Socket.IO
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = getSocket(token);
    const onNotification = (n: { type: string; message: string; timeUtc?: string }) => {
      if (n.type === "schedule_reminder" && n.timeUtc) {
        const local = new Date(n.timeUtc).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        showToast(`⏰ ${n.message} (${local})`);
      } else {
        showToast(n.message);
      }
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Link href="/discover" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          stududu
        </Link>
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
        <div className="w-24 flex justify-end relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background relative">
        {children}
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
