"use client";

import * as React from "react";
import { api } from "@/lib/api";

export type DemographicItem = {
  name: string;
  count: number;
  percentage: number;
};

export type DashboardStats = {
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
  demographics?: {
    userOrigins: DemographicItem[];
    learningLanguages: DemographicItem[];
  };
};

export function useAdminDashboard() {
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

  return { stats, loading, error, fetchStats };
}
