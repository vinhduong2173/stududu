"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { DashboardStats } from "@/hooks/useAdminDashboard";

export function AdminRecentUsersCard({ stats }: { stats: DashboardStats }) {
  return (
    <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/80 bg-surface p-6 shadow-xs">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Users className="h-4 w-4 text-blue-500" /> Thành viên mới đăng ký
          </h2>
          <Link href="/admin/users" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.recentUsers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Chưa có người dùng nào.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                    {u.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {u.displayName}
                    </Link>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" />
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
