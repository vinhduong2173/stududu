"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { BookOpen, FileText, Flag, LayoutDashboard, ListTree, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

export type AdminUser = {
  id: number;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
};

interface AdminSidebarProps {
  adminUser: AdminUser;
  openReportsCount: number;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ adminUser, openReportsCount, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000";
      router.push("/login", { locale: "en" });
    }
  };

  const navItems = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Báo cáo", href: "/admin/reports", icon: Flag, exact: false, badge: openReportsCount },
    { name: "Người dùng", href: "/admin/users", icon: Users, exact: false },
    { name: "Từ vựng đã lưu", href: "/admin/vocabulary", icon: BookOpen, exact: false },
    { name: "Danh mục", href: "/admin/catalog", icon: ListTree, exact: false },
    { name: "Quản lý Bộ đề", href: "/admin/quizzes", icon: FileText, exact: false },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-surface border-r border-border shadow-xs">
      <div>
        {/* Header Logo */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <Logo size="sm" href="/admin" />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Hệ thống Quản trị</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">v1.0</span>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-muted/70 uppercase tracking-wider">Menu chính</div>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "text-muted hover:bg-muted/10 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn("inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 min-w-[20px]", isActive ? "bg-white text-primary" : "bg-rose-500 text-white shadow-xs")}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Admin User Info */}
      <div className="p-3 border-t border-border/60 bg-surface/50">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-muted/10 border border-border/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
              {adminUser.displayName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{adminUser.displayName}</p>
              <p className="text-[11px] text-muted truncate">{adminUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Đăng xuất">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
