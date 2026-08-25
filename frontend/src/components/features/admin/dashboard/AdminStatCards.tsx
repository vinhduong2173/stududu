"use client";

import * as React from "react";
import { CheckCircle2, MessageSquare, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/hooks/useAdminDashboard";

export function AdminStatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {/* Total Users */}
      <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Tổng người dùng</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-bold text-blue-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{stats.totalUsers.toLocaleString()}</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{stats.userGrowthWeeklyPercent}% tuần này</span>
        </div>
      </div>

      {/* Open Reports */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all",
          stats.openReportsCount > 0 ? "border-rose-200 bg-rose-50/20" : "border-border/80 bg-surface hover:border-primary/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Report chưa xử lý</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 font-bold text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{stats.openReportsCount}</span>
        </div>
        <div className="mt-2 text-xs font-semibold">
          {stats.openReportsCount > 0 ? (
            <span className="flex items-center gap-1 font-bold text-rose-600">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-rose-600" />
              Cần xử lý ngay
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> An toàn
            </span>
          )}
        </div>
      </div>

      {/* Active Conversations Today */}
      <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Cuộc hội thoại</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 font-bold text-purple-600">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{stats.activeConversationsToday}</span>
        </div>
        <div className="mt-2 text-xs font-medium text-muted">Hoạt động hôm nay</div>
      </div>
    </div>
  );
}
