"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

type UserItem = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: "admin" | "member";
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  _count: { reportsReceived: number };
};

type UserResponse = {
  items: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_BADGE: Record<UserItem["status"], { label: string; className: string }> = {
  active: { label: "Hoạt động", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  suspended: { label: "Tạm khóa", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  deleted: { label: "Đã xóa", className: "bg-rose-500/10 text-rose-600 border-rose-200" },
};

export default function AdminUsersPage() {
  const [data, setData] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const fetchUsers = React.useCallback(async (p: number, s: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: p.toString(),
        limit: "10",
        ...(s ? { search: s } : {}),
        ...(status ? { status } : {}),
      });
      const res = await api<UserResponse>(`/admin/users?${query.toString()}`);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers(page, search, statusFilter);
  }, [page, statusFilter, fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search, statusFilter);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Quản lý Người dùng</h1>
            {data && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {data.total} thành viên
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-1">Danh sách thành viên, tra cứu thông tin và thực hiện kiểm duyệt tài khoản.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchUsers(page, search, statusFilter)} className="self-start sm:self-auto gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Làm mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-10 px-4 font-semibold">
            Tìm
          </Button>
        </form>

        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { value: "", label: "Tất cả" },
            { value: "active", label: "Hoạt động" },
            { value: "suspended", label: "Tạm khóa" },
            { value: "deleted", label: "Đã xóa" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-surface text-muted hover:bg-muted/10 border-border/80",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchUsers(page, search, statusFilter)}
            className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="font-semibold text-foreground">Không tìm thấy người dùng nào</p>
            <p className="text-sm text-muted mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
          </div>
        ) : (
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
        )}

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-border/80 flex items-center justify-between bg-surface/50">
            <span className="text-xs text-muted">
              Trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng <strong>{data.total}</strong> kết quả)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="gap-1 text-xs"
              >
                Sau <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
