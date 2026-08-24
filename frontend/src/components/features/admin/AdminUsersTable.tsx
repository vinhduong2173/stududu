"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExternalLink, ShieldAlert, Users, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_BADGE, UserResponse } from "@/hooks/useAdminUsers";

interface AdminUsersTableProps {
  data: UserResponse | null;
  loading: boolean;
}

export function AdminUsersTable({ data, loading }: AdminUsersTableProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-16 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs text-center py-16 px-4">
        <Users className="h-10 w-10 text-muted mx-auto mb-3" />
        <p className="font-semibold text-foreground">Không tìm thấy người dùng nào</p>
        <p className="text-sm text-muted mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border/80 bg-muted/20 text-xs font-bold text-muted uppercase tracking-wider">
              <th className="px-5 py-3.5">Thành viên</th>
              <th className="px-5 py-3.5">Vai trò</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5">Báo cáo nhận</th>
              <th className="px-5 py-3.5">Ngày đăng ký</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.items.map((u) => (
              <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-sm">
                      {u.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <Link href={`/admin/users/${u.id}`} className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                        <span>{u.displayName}</span>
                        <ExternalLink className="h-3 w-3 text-muted" />
                      </Link>
                      <p className="text-xs text-muted mt-0.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                      u.role === "admin"
                        ? "bg-purple-500/10 text-purple-600 border border-purple-200"
                        : "bg-slate-500/10 text-slate-600",
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border", STATUS_BADGE[u.status].className)}>
                    {STATUS_BADGE[u.status].label}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {u._count.reportsReceived > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-200">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {u._count.reportsReceived} lần
                    </span>
                  ) : (
                    <span className="text-xs text-muted">0</span>
                  )}
                </td>
                <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                    <Link href={`/admin/users/${u.id}`}>
                      <UserX className="h-3.5 w-3.5 text-rose-500" /> Xem & Kiểm duyệt
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
