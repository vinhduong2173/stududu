"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";

export type Report = {
  id: number;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
  reporter: { id: number; displayName: string; email: string };
  reported: { id: number; displayName: string; email: string; status: string };
};

export const STATUS_TABS: { value: string; label: string }[] = [
  { value: "open", label: "Đang mở" },
  { value: "reviewed", label: "Đã xử lý" },
  { value: "dismissed", label: "Đã bỏ qua" },
  { value: "", label: "Tất cả" },
];

export const STATUS_BADGE: Record<Report["status"], { label: string; className: string; icon: React.ElementType }> = {
  open: { label: "Đang mở", className: "bg-rose-500/10 text-rose-600 border-rose-200", icon: ShieldAlert },
  reviewed: { label: "Đã xử lý", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  dismissed: { label: "Đã bỏ qua", className: "bg-slate-500/10 text-slate-600 border-slate-200", icon: Clock },
};

export function useAdminReports() {
  const [status, setStatus] = React.useState("open");
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReports = React.useCallback(async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Report[]>(`/admin/reports${s ? `?status=${s}` : ""}`);
      setReports(data);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Không thể kết nối đến máy chủ.";
      setError(msg);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReports(status);
  }, [status, fetchReports]);

  const updateStatus = async (id: number, newStatus: "reviewed" | "dismissed") => {
    try {
      await api(`/admin/reports/${id}`, { method: "PATCH", body: { status: newStatus } });
      fetchReports(status);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    }
  };

  return {
    status,
    setStatus,
    reports,
    loading,
    error,
    fetchReports,
    updateStatus,
  };
}
