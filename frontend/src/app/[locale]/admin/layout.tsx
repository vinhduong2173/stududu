"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flag, LayoutDashboard, ListTree, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";

type AdminUser = {
  id: number;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = React.useState<AdminUser | null>(null);
  const [openReportsCount, setOpenReportsCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      api<AdminUser>("/users/me"),
      api<{ openReportsCount: number }>("/admin/stats").catch(() => ({ openReportsCount: 0 })),
    ])
      .then(([me, stats]) => {
        if (me.role !== "admin") {
          router.replace("/discover");
        } else {
          setAdminUser(me);
          setOpenReportsCount(stats.openReportsCount || 0);
          setLoading(false);
        }
      })
      .catch(() => router.replace("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !adminUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    }
  };

  const navItems = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Báo cáo", href: "/admin/reports", icon: Flag, exact: false, badge: openReportsCount },
    { name: "Người dùng", href: "/admin/users", icon: Users, exact: false },
    { name: "Danh mục", href: "/admin/catalog", icon: ListTree, exact: false },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col justify-between shadow-xs">
        <div>
          {/* Header Logo */}
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <div>
              <Logo size="sm" href="/admin" />
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Hệ thống Quản trị</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              v1.0
            </span>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold text-muted/70 uppercase tracking-wider">
              Menu chính
            </div>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted hover:bg-muted/10 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 min-w-[20px]",
                        isActive
                          ? "bg-white text-primary"
                          : "bg-rose-500 text-white shadow-xs",
                      )}
                    >
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
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                {adminUser.displayName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{adminUser.displayName}</p>
                <p className="text-[11px] text-muted truncate">{adminUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background/50 p-6 md:p-8">{children}</main>
    </div>
  );
}
