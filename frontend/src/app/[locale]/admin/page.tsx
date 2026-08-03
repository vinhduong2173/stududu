"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

type DashboardStats = {
  totalUsers: number;
  userGrowthWeeklyPercent: number;
  openReportsCount: number;
  newUsersThisMonth: number;
  activeConversationsToday: number;
  recentReports: {
    id: number;
    reason: string;
    status: "open" | "reviewed" | "dismissed";
    createdAt: string;
    reported: { id: number; displayName: string; email: string; avatarUrl?: string | null; status: string };
    reporter: { id: number; displayName: string; email: string };
  }[];
  recentUsers: {
    id: number;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    createdAt: string;
  }[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<DashboardStats>("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-700 space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
        <p className="font-semibold">{error || "Không thể tải dữ liệu thống kê"}</p>
        <Button size="sm" onClick={fetchStats} variant="ghost" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tổng quan Hệ thống</h1>
          <p className="text-sm text-muted mt-1">Chào mừng trở lại, Admin 👋 Sau đây là tình hình hoạt động của Stududu.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="self-start sm:self-auto gap-2">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tổng người dùng</span>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{stats.userGrowthWeeklyPercent}% tuần này</span>
          </div>
        </div>

        {/* Open Reports */}
        <div
          className={cn(
            "bg-surface rounded-2xl p-5 border shadow-xs relative overflow-hidden transition-all",
            stats.openReportsCount > 0
              ? "border-rose-200 bg-rose-50/20"
              : "border-border/80 hover:border-primary/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Report chưa xử lý</span>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {stats.openReportsCount}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold">
            {stats.openReportsCount > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                Cần xử lý ngay
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> An toàn
              </span>
            )}
          </div>
        </div>

        {/* New Users This Month */}
        <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Người dùng mới</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {stats.newUsersThisMonth}
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-muted">Tháng này</div>
        </div>

        {/* Active Conversations Today */}
        <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Cuộc hội thoại</span>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {stats.activeConversationsToday}
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-muted">Hoạt động hôm nay</div>
        </div>
      </div>

      {/* 2 Panels: Recent Reports & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Recent Reports */}
        <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> Báo cáo gần đây
              </h2>
              <Link href="/admin/reports" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả ({stats.openReportsCount}) <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {stats.recentReports.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Không có báo cáo nào.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {stats.recentReports.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/users/${r.reported.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate">
                          {r.reported.displayName}
                        </Link>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            r.status === "open"
                              ? "bg-rose-500/10 text-rose-600 border border-rose-200"
                              : r.status === "reviewed"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-slate-500/10 text-slate-600",
                          )}
                        >
                          {r.status === "open" ? "Mở" : r.status === "reviewed" ? "Đã xử lý" : "Bỏ qua"}
                        </span>
                      </div>
                      <p className="text-xs text-muted truncate mt-0.5">Lý do: "{r.reason}"</p>
                    </div>

                    <Button asChild size="sm" variant="ghost" className="shrink-0 text-xs font-semibold">
                      <Link href={`/admin/users/${r.reported.id}`}>
                        <UserX className="h-3.5 w-3.5 mr-1 text-rose-500" /> Xử lý
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Recent Users */}
        <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> Thành viên mới đăng ký
              </h2>
              <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Chưa có người dùng nào.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-sm">
                        {u.displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/users/${u.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block">
                          {u.displayName}
                        </Link>
                        <p className="text-xs text-muted truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted flex items-center gap-1">
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
      </div>
    </div>
  );
}
