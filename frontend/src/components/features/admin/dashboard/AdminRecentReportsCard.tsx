"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/hooks/useAdminDashboard";

export function AdminRecentReportsCard({ stats }: { stats: DashboardStats }) {
  return (
    <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/80 bg-surface p-6 shadow-xs">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShieldAlert className="h-4 w-4 text-rose-500" /> Báo cáo gần đây
          </h2>
          <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Xem tất cả ({stats.openReportsCount}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.recentReports.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Không có báo cáo nào.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {stats.recentReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${r.reported.id}`}
                      className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {r.reported.displayName}
                    </Link>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        r.status === "open"
                          ? "border border-rose-200 bg-rose-500/10 text-rose-600"
                          : r.status === "reviewed"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-slate-500/10 text-slate-600",
                      )}
                    >
                      {r.status === "open" ? "Mở" : r.status === "reviewed" ? "Đã xử lý" : "Bỏ qua"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">Lý do: &quot;{r.reason}&quot;</p>
                </div>

                <Button asChild size="sm" variant="ghost" className="shrink-0 text-xs font-semibold">
                  <Link href={`/admin/users/${r.reported.id}`}>
                    <UserX className="mr-1 h-3.5 w-3.5 text-rose-500" /> Xử lý
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
