"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { AdminSidebar, AdminUser } from "@/components/features/admin/layout/AdminSidebar";
import { AdminMobileHeader } from "@/components/features/admin/layout/AdminMobileHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      .catch(() => {
        document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000";
        router.replace("/login", { locale: "en" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !adminUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Top Header */}
      <AdminMobileHeader
        adminUser={adminUser}
        openReportsCount={openReportsCount}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full">
        <AdminSidebar
          adminUser={adminUser}
          openReportsCount={openReportsCount}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background/50 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
