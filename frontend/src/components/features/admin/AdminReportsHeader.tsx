"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminReportsHeaderProps {
  reportsCount: number;
  loading: boolean;
  onRefresh: () => void;
}

export function AdminReportsHeader({
  reportsCount,
  loading,
  onRefresh,
}: AdminReportsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Báo cáo từ người dùng</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-200">
            {reportsCount} báo cáo
          </span>
        </div>
        <p className="text-sm text-muted mt-1">Xử lý báo cáo vi phạm tiêu chuẩn cộng đồng và kiểm duyệt thành viên.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} className="self-start sm:self-auto gap-2">
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Làm mới
      </Button>
    </div>
  );
}
