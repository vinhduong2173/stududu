"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserResponse } from "@/hooks/useAdminUsers";

interface AdminUsersHeaderProps {
  data: UserResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export function AdminUsersHeader({ data, loading, onRefresh }: AdminUsersHeaderProps) {
  return (
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
      <Button variant="outline" size="sm" onClick={onRefresh} className="self-start sm:self-auto gap-2">
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Làm mới
      </Button>
    </div>
  );
}
