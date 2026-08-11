"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUsersFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  setPage: (page: number) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

export function AdminUsersFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  setPage,
  handleSearchSubmit,
}: AdminUsersFilterBarProps) {
  return (
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
  );
}
