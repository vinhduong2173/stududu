"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

const STATUS_BADGE: Record<Report["status"], { label: string; className: string }> = {
  open: { label: "Đang mở", className: "bg-warning/10 text-warning" },
  reviewed: { label: "Đã xử lý", className: "bg-success/10 text-success" },
  dismissed: { label: "Đã bỏ qua", className: "bg-muted/10 text-muted" },
};

export default function AdminReportsPage() {
  const [status, setStatus] = React.useState("open");
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchReports = React.useCallback(async (s: string) => {
    setLoading(true);
    try {
      const data = await api<Report[]>(`/admin/reports${s ? `?status=${s}` : ""}`);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReports(status);
  }, [status, fetchReports]);

  const updateStatus = async (id: number, newStatus: "reviewed" | "dismissed") => {
    await api(`/admin/reports/${id}`, { method: "PATCH", body: { status: newStatus } });
    fetchReports(status);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Báo cáo từ người dùng</h1>
      <p className="text-sm text-muted mb-6">Xử lý report và kiểm duyệt người vi phạm.</p>

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setStatus(tab.value)}>
            <Chip active={status === tab.value} variant="outline" className="cursor-pointer">
              {tab.label}
            </Chip>
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-muted">Không có báo cáo nào.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-semibold">Người bị báo cáo</th>
                <th className="px-4 py-3 font-semibold">Người báo cáo</th>
                <th className="px-4 py-3 font-semibold">Lý do</th>
                <th className="px-4 py-3 font-semibold">Thời gian</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${r.reported.id}`} className="font-semibold text-primary hover:underline">
                      {r.reported.displayName}
                    </Link>
                    <p className="text-xs text-muted">{r.reported.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{r.reporter.displayName}</p>
                    <p className="text-xs text-muted">{r.reporter.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-56">
                    <p className="text-foreground line-clamp-2">{r.reason}</p>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[r.status].className)}>
                      {STATUS_BADGE[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/users/${r.reported.id}`}>Xử lý</Link>
                      </Button>
                      {r.status === "open" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "reviewed")}>
                            Đánh dấu đã xử lý
                          </Button>
                          <Button size="sm" variant="ghost" className="text-muted" onClick={() => updateStatus(r.id, "dismissed")}>
                            Bỏ qua
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
