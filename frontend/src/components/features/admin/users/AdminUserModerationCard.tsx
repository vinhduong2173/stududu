"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { UserDetail } from "./AdminUserDetailCard";

export type Violation = {
  id: number;
  action: "warn" | "suspend_3d" | "suspend_1w" | "hard_delete";
  reason: string;
  createdAt: string;
  admin: { id: number; displayName: string };
};

const ACTIONS: { value: Violation["action"]; label: string; danger?: boolean }[] = [
  { value: "warn", label: "Cảnh cáo (chỉ ghi log)" },
  { value: "suspend_3d", label: "Vô hiệu hóa 3 ngày" },
  { value: "suspend_1w", label: "Vô hiệu hóa 1 tuần" },
  { value: "hard_delete", label: "Xóa tài khoản", danger: true },
];

interface AdminUserModerationCardProps {
  user: UserDetail;
  violations: Violation[];
  action: Violation["action"];
  setAction: (action: Violation["action"]) => void;
  reason: string;
  setReason: (reason: string) => void;
  confirmDelete: boolean;
  setConfirmDelete: (confirm: boolean) => void;
  formError: string;
  submitting: boolean;
  onModerate: () => void;
}

export function AdminUserModerationCard({
  user,
  violations,
  action,
  setAction,
  reason,
  setReason,
  confirmDelete,
  setConfirmDelete,
  formError,
  submitting,
  onModerate,
}: AdminUserModerationCardProps) {
  if (user.role === "admin") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <ShieldAlert className="h-5 w-5 text-primary" /> Quyền Quản trị viên
        </h2>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground space-y-2">
          <p className="font-semibold text-primary">Tài khoản Quản trị viên hệ thống (Admin)</p>
          <p className="text-muted text-xs leading-relaxed">
            Tài khoản này có vai trò Quản trị viên cao cấp. Hệ thống không áp dụng các chế tài kiểm duyệt hoặc xóa tài khoản đối với Admin để đảm bảo an toàn vận hành.
          </p>
        </div>
      </section>
    );
  }

  const suspendCount = violations.filter((v) => v.action === "suspend_3d" || v.action === "suspend_1w").length;
  const suggestion =
    suspendCount === 0
      ? "Vô hiệu hóa 3 ngày"
      : suspendCount === 1
      ? "Vô hiệu hóa 1 tuần"
      : "Xóa tài khoản (đã tái phạm nhiều lần)";

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <ShieldAlert className="h-5 w-5 text-warning" /> Xử lý vi phạm
      </h2>

      {/* Gợi ý leo thang BR-10 */}
      <div className="mb-4 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm">
        <span className="font-semibold text-primary">Gợi ý theo quy tắc leo thang:</span>{" "}
        <span className="text-foreground">{suggestion}</span>
        <span className="text-muted"> · đã bị khóa {suspendCount} lần trước đây</span>
      </div>

      {formError && <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">{formError}</div>}

      <div className="mb-4 space-y-2">
        {ACTIONS.map((a) => (
          <label
            key={a.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/5 has-[:checked]:border-primary has-[:checked]:bg-primary/5",
              a.danger && "has-[:checked]:border-error has-[:checked]:bg-error/5",
            )}
          >
            <input
              type="radio"
              name="mod-action"
              className="h-4 w-4 accent-primary"
              checked={action === a.value}
              onChange={() => {
                setAction(a.value);
                setConfirmDelete(false);
              }}
            />
            <span className={cn("text-sm font-medium", a.danger ? "text-error" : "text-foreground")}>{a.label}</span>
          </label>
        ))}
      </div>

      <textarea
        className="mb-4 h-20 w-full resize-none rounded-xl border border-border bg-transparent p-3 text-sm outline-none focus:border-primary"
        placeholder="Lý do xử lý (bắt buộc)…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {confirmDelete && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm font-medium text-error">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Xác nhận lần 2: tài khoản sẽ bị ẩn danh vĩnh viễn. Bấm nút lần nữa để thực hiện.</span>
        </div>
      )}

      <Button
        className={cn("w-full", action === "hard_delete" && "bg-error hover:bg-error/90")}
        onClick={onModerate}
        disabled={submitting || user.status === "deleted"}
      >
        {submitting
          ? "Đang xử lý..."
          : action === "hard_delete"
          ? confirmDelete
            ? "Xác nhận xóa tài khoản"
            : "Xóa tài khoản"
          : "Áp dụng xử lý"}
      </Button>
    </section>
  );
}
