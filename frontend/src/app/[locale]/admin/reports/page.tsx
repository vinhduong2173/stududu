"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { useAdminReports } from "@/hooks/useAdminReports";
import { AdminReportsHeader } from "@/components/features/admin/AdminReportsHeader";
import { AdminReportsFilterTabs } from "@/components/features/admin/AdminReportsFilterTabs";
import { AdminReportsTable } from "@/components/features/admin/AdminReportsTable";

export default function AdminReportsPage() {
  const r = useAdminReports();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdminReportsHeader
        reportsCount={r.reports.length}
        loading={r.loading}
        onRefresh={() => r.fetchReports(r.status)}
      />

      <AdminReportsFilterTabs status={r.status} setStatus={r.setStatus} />

      {r.error && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{r.error}</span>
          </div>
          <button
            onClick={() => r.fetchReports(r.status)}
            className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      <AdminReportsTable
        reports={r.reports}
        loading={r.loading}
        updateStatus={r.updateStatus}
      />
    </div>
  );
}
