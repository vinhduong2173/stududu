"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, RefreshCw, ShieldAlert, UserX } from "lucide-react";

/** MÀN 14 — Danh sách Report (US-19). */

type Report = {
  id: number;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
  reporter: { id: number; displayName: string; email: string };
  reported: { id: number; displayName: string; email: string; status: string };
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "open", label: "Đang mở" },
  { value: "reviewed", label: "Đã xử lý" },
  { value: "dismissed", label: "Đã bỏ qua" },
  { value: "", label: "Tất cả" },
];

const STATUS_BADGE: Record<Report["status"], { label: string; className: string; icon: React.ElementType }> = {
  open: { label: "Đang mở", className: "bg-rose-500/10 text-rose-600 border-rose-200", icon: ShieldAlert },
  reviewed: { label: "Đã xử lý", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  dismissed: { label: "Đã bỏ qua", className: "bg-slate-500/10 text-slate-600 border-slate-200", icon: Clock },
};

export default function AdminReportsPage() {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Báo cáo từ người dùng</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-200">
              {reports.length} báo cáo
            </span>
          </div>
          <p className="text-sm text-muted mt-1">Xử lý báo cáo vi phạm tiêu chuẩn cộng đồng và kiểm duyệt thành viên.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchReports(status)} className="self-start sm:self-auto gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Làm mới
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-surface rounded-2xl border border-border/80 shadow-xs w-fit">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setStatus(tab.value)}>
            <Chip active={status === tab.value} variant="outline" className="cursor-pointer font-medium text-xs px-4 py-2">
              {tab.label}
            </Chip>
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReports(status)}
            className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Content */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground">Không tìm thấy báo cáo nào</p>
            <p className="text-sm text-muted mt-1">Hệ thống đang hoạt động an toàn và không có nội dung vi phạm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/20 text-xs font-bold text-muted uppercase tracking-wider">
                  <th className="px-5 py-3.5">Người bị báo cáo</th>
                  <th className="px-5 py-3.5">Người báo cáo</th>
                  <th className="px-5 py-3.5">Lý do vi phạm</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reports.map((r) => {
                  const StatusIcon = STATUS_BADGE[r.status].icon;
                  return (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/users/${r.reported.id}`} className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                          <span>{r.reported.displayName}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-primary transition-colors" />
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{r.reported.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{r.reporter.displayName}</p>
                        <p className="text-xs text-muted mt-0.5">{r.reporter.email}</p>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-foreground text-xs leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/40 font-mono">
                          "{r.reason}"
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border", STATUS_BADGE[r.status].className)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {STATUS_BADGE[r.status].label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                            <Link href={`/admin/users/${r.reported.id}`}>
                              <UserX className="h-3.5 w-3.5 text-rose-500" /> Xem & Kiểm duyệt
                            </Link>
                          </Button>
                          {r.status === "open" && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, "reviewed")} className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                                Đã xử lý
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs font-medium text-muted hover:text-foreground" onClick={() => updateStatus(r.id, "dismissed")}>
                                Bỏ qua
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
