"use client";

import * as React from "react";
import { api } from "@/lib/api";

export type UserItem = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: "admin" | "member";
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  _count: { reportsReceived: number };
};

export type UserResponse = {
  items: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const STATUS_BADGE: Record<UserItem["status"], { label: string; className: string }> = {
  active: { label: "Hoạt động", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  suspended: { label: "Tạm khóa", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  deleted: { label: "Đã xóa", className: "bg-rose-500/10 text-rose-600 border-rose-200" },
};

export function useAdminUsers() {
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

  return {
    data,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    fetchUsers,
    handleSearchSubmit,
  };
}
