"use client";

import * as React from "react";
import { Violation } from "./AdminUserModerationCard";

const ACTION_LABEL: Record<Violation["action"], string> = {
  warn: "Cảnh cáo",
  suspend_3d: "Khóa 3 ngày",
  suspend_1w: "Khóa 1 tuần",
  hard_delete: "Xóa tài khoản",
};

export function AdminUserViolationsCard({ violations }: { violations: Violation[] }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-foreground">Lịch sử vi phạm ({violations.length})</h2>
      {violations.length === 0 ? (
        <p className="text-sm text-muted">Chưa có xử lý nào — người dùng sạch.</p>
      ) : (
        <ul className="space-y-3">
          {violations.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{ACTION_LABEL[v.action]}</p>
                <p className="text-sm text-muted">{v.reason}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted">
                <p>{new Date(v.createdAt).toLocaleString("vi-VN")}</p>
                <p>bởi {v.admin.displayName}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
