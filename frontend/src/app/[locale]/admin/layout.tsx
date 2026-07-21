"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Flag, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";

/** MÀN 14–16 — layout riêng /admin (US-19 AC3: chỉ role admin). */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    api<{ role: string }>("/users/me")
      .then((me) => {
        if (me.role !== "admin") {
          router.replace("/discover");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => router.replace("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const navItems = [
    { name: "Báo cáo", href: "/admin", icon: Flag, exact: true },
    { name: "Danh mục", href: "/admin/catalog", icon: ListTree, exact: false },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-5 border-b border-border">
          <Logo size="sm" href="/admin" />
          <p className="text-xs text-muted mt-1 font-semibold uppercase tracking-wider">Quản trị</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-muted/10 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            href="/discover"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-muted/10 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Về ứng dụng
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
