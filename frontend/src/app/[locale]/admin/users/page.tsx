"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { AdminUsersHeader } from "@/components/features/admin/AdminUsersHeader";
import { AdminUsersFilterBar } from "@/components/features/admin/AdminUsersFilterBar";
import { AdminUsersTable } from "@/components/features/admin/AdminUsersTable";
import { AdminUsersPagination } from "@/components/features/admin/AdminUsersPagination";

export default function AdminUsersPage() {
  const u = useAdminUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdminUsersHeader
        data={u.data}
        loading={u.loading}
        onRefresh={() => u.fetchUsers(u.page, u.search, u.statusFilter)}
      />

      <AdminUsersFilterBar
        search={u.search}
        setSearch={u.setSearch}
        statusFilter={u.statusFilter}
        setStatusFilter={u.setStatusFilter}
        setPage={u.setPage}
        handleSearchSubmit={u.handleSearchSubmit}
      />

      {u.error && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{u.error}</span>
          </div>
          <button
            onClick={() => u.fetchUsers(u.page, u.search, u.statusFilter)}
            className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      <AdminUsersTable data={u.data} loading={u.loading} />

      {u.data && <AdminUsersPagination data={u.data} page={u.page} setPage={u.setPage} />}
    </div>
  );
}
