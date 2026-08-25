"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ExternalLink, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Report, STATUS_BADGE } from "@/hooks/useAdminReports";

interface AdminReportsTableProps {
  reports: Report[];
  loading: boolean;
  updateStatus: (id: number, status: "reviewed" | "dismissed") => void;
}

export function AdminReportsTable({ reports, loading, updateStatus }: AdminReportsTableProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-16 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs text-center py-16 px-4">
        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="font-semibold text-foreground">Không tìm thấy báo cáo nào</p>
        <p className="text-sm text-muted mt-1">Hệ thống đang hoạt động an toàn và không có nội dung vi phạm.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
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
                      &quot;{r.reason}&quot;
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
    </div>
  );
}
