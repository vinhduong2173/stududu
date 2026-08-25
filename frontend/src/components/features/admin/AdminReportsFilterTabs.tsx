"use client";

import * as React from "react";
import { Chip } from "@/components/ui/Chip";
import { STATUS_TABS } from "@/hooks/useAdminReports";

interface AdminReportsFilterTabsProps {
  status: string;
  setStatus: (val: string) => void;
}

export function AdminReportsFilterTabs({ status, setStatus }: AdminReportsFilterTabsProps) {
  return (
    <div className="flex gap-2 p-1 bg-surface rounded-2xl border border-border/80 shadow-xs w-fit">
      {STATUS_TABS.map((tab) => (
        <button key={tab.value} onClick={() => setStatus(tab.value)}>
          <Chip active={status === tab.value} variant="outline" className="cursor-pointer font-medium text-xs px-4 py-2">
            {tab.label}
          </Chip>
        </button>
      ))}
    </div>
  );
}
