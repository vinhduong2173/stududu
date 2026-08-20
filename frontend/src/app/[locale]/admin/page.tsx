"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AdminStatCards } from "@/components/features/admin/dashboard/AdminStatCards";
import { AdminRecentReportsCard } from "@/components/features/admin/dashboard/AdminRecentReportsCard";
import { AdminDemographicsCharts } from "@/components/features/admin/dashboard/AdminDemographicsCharts";

export default function AdminDashboardPage() {
  const { stats, loading, error, fetchStats } = useAdminDashboard();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto my-12 max-w-xl space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" />
        <p className="font-semibold">{error || "Không thể tải dữ liệu thống kê"}</p>
        <Button size="sm" onClick={fetchStats} variant="ghost" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan Hệ thống</h1>
          <p className="mt-1 text-sm text-muted">Chào mừng trở lại, Admin. Sau đây là tình hình hoạt động của Stududu.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      <AdminStatCards stats={stats} />

      {/* Demographics Pie Charts: User Origins & Learning Languages */}
      <AdminDemographicsCharts
        userOrigins={stats.demographics?.userOrigins}
        learningLanguages={stats.demographics?.learningLanguages}
      />

      {/* Recent Reports Widget */}
      <div className="max-w-3xl">
        <AdminRecentReportsCard stats={stats} />
      </div>
    </div>
  );
}
