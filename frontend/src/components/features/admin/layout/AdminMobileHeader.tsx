"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AdminSidebar, AdminUser } from "./AdminSidebar";

interface AdminMobileHeaderProps {
  adminUser: AdminUser;
  openReportsCount: number;
}

export function AdminMobileHeader({
  adminUser,
  openReportsCount,
}: AdminMobileHeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close drawer on route change or ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
            aria-label="Mở menu quản trị"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" href="/admin" />
        </div>

        <div className="flex items-center gap-2">
          {openReportsCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full text-[11px] font-bold px-2 py-0.5 bg-rose-500 text-white shadow-xs">
              {openReportsCount} báo cáo
            </span>
          )}
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
            {adminUser.displayName?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-2xl z-10 flex flex-col">
            <div className="absolute top-4 right-3">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar
              adminUser={adminUser}
              openReportsCount={openReportsCount}
              onCloseMobile={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
