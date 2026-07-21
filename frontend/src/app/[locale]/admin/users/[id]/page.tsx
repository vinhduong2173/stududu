"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/features/TrustDialogs";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** MÀN 15 — Chi tiết người dùng + xử lý vi phạm (US-20). Leo thang: warn → 3 ngày → 1 tuần → xóa. */

type UserDetail = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  status: "active" | "suspended" | "deleted";
  suspendedUntil?: string | null;
  lastActive?: string | null;
  createdAt: string;
  _count: { reportsReceived: number; reportsSent: number };
};

type Violation = {
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

const ACTION_LABEL: Record<Violation["action"], string> = {
  warn: "Cảnh cáo",
  suspend_3d: "Khóa 3 ngày",
  suspend_1w: "Khóa 1 tuần",
  hard_delete: "Xóa tài khoản",
};

const STATUS_LABEL: Record<UserDetail["status"], { label: string; className: string }> = {
  active: { label: "Đang hoạt động", className: "bg-success/10 text-success" },
  suspended: { label: "Đang bị khóa", className: "bg-warning/10 text-warning" },
  deleted: { label: "Đã xóa", className: "bg-error/10 text-error" },
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? parseInt(params.id) : 0;
  const { show: showToast, toast } = useToast();

  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [violations, setViolations] = React.useState<Violation[]>([]);
  const [error, setError] = React.useState("");

  // Form xử lý
  const [action, setAction] = React.useState<Violation["action"]>("warn");
  const [reason, setReason] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const load = React.useCallback(() => {
    if (!id) return;
    Promise.all([
      api<UserDetail>(`/admin/users/${id}`),
      api<Violation[]>(`/admin/users/${id}/violations`),
    ])
      .then(([u, v]) => {
        setUser(u);
        setViolations(v);
      })
      .catch((err) => setError(err.message || "Không tải được dữ liệu"));
  }, [id]);

  React.useEffect(load, [load]);

  const handleModerate = async () => {
    if (!reason.trim()) {
      setFormError("Vui lòng ghi lý do xử lý.");
      return;
    }
    // Xóa tài khoản cần xác nhận 2 bước
    if (action === "hard_delete" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api(`/admin/users/${id}/moderate`, {
        method: "POST",
        body: { action, reason: reason.trim() },
      });
      showToast("Đã ghi nhận xử lý");
      setReason("");
      setConfirmDelete(false);
      setAction("warn");
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!user)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  const statusInfo = STATUS_LABEL[user.status];

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Chi tiết người dùng</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Thông tin */}
        <section className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar src={user.avatarUrl ?? undefined} fallback={user.displayName.charAt(0)} size="lg" />
            <div>
              <p className="text-lg font-bold text-foreground">{user.displayName}</p>
              <p className="text-sm text-muted">{user.email}</p>
              <span className={cn("mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", statusInfo.className)}>
                {statusInfo.label}
                {user.status === "suspended" && user.suspendedUntil &&
                  ` đến ${new Date(user.suspendedUntil).toLocaleDateString("vi-VN")}`}
              </span>
            </div>
          </div>

          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted">Tham gia</dt>
              <dd className="font-medium text-foreground">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Hoạt động gần nhất</dt>
              <dd className="font-medium text-foreground">
                {user.lastActive ? new Date(user.lastActive).toLocaleString("vi-VN") : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Bị báo cáo</dt>
              <dd className="font-medium text-foreground">{user._count.reportsReceived} lần</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Đã báo cáo người khác</dt>
              <dd className="font-medium text-foreground">{user._count.reportsSent} lần</dd>
            </div>
          </dl>

          {user.bio && (
            <p className="mt-4 text-sm text-muted border-t border-border pt-4 whitespace-pre-wrap">{user.bio}</p>
          )}
        </section>

        {/* Xử lý vi phạm */}
        <section className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" /> Xử lý vi phạm
          </h2>

          {/* US-20: quy tắc leo thang — lần 1 → 3 ngày, lần 2 → 1 tuần, tái phạm tiếp → xóa cứng */}
          {(() => {
            const suspendCount = violations.filter(
              (v) => v.action === "suspend_3d" || v.action === "suspend_1w",
            ).length;
            const suggestion =
              suspendCount === 0
                ? "Vô hiệu hóa 3 ngày"
                : suspendCount === 1
                  ? "Vô hiệu hóa 1 tuần"
                  : "Xóa tài khoản (đã tái phạm nhiều lần)";
            return (
              <div className="mb-4 rounded-xl bg-primary/5 border border-primary/15 p-3 text-sm">
                <span className="font-semibold text-primary">Gợi ý theo quy tắc leo thang:</span>{" "}
                <span className="text-foreground">{suggestion}</span>
                <span className="text-muted"> · đã bị khóa {suspendCount} lần trước đây</span>
              </div>
            );
          })()}

          {formError && <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">{formError}</div>}

          <div className="space-y-2 mb-4">
            {ACTIONS.map((a) => (
              <label
                key={a.value}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                  a.danger && "has-[:checked]:border-error has-[:checked]:bg-error/5",
                )}
              >
                <input
                  type="radio"
                  name="mod-action"
                  className="accent-primary h-4 w-4"
                  checked={action === a.value}
                  onChange={() => { setAction(a.value); setConfirmDelete(false); }}
                />
                <span className={cn("text-sm font-medium", a.danger ? "text-error" : "text-foreground")}>
                  {a.label}
                </span>
              </label>
            ))}
          </div>

          <textarea
            className="w-full rounded-xl border border-border bg-transparent p-3 text-sm outline-none focus:border-primary resize-none h-20 mb-4"
            placeholder="Lý do xử lý (bắt buộc)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          {confirmDelete && (
            <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error font-medium">
              ⚠️ Xác nhận lần 2: tài khoản sẽ bị ẩn danh vĩnh viễn. Bấm nút lần nữa để thực hiện.
            </div>
          )}

          <Button
            className={cn("w-full", action === "hard_delete" && "bg-error hover:bg-error/90")}
            onClick={handleModerate}
            disabled={submitting || user.status === "deleted"}
          >
            {submitting
              ? "Đang xử lý..."
              : action === "hard_delete"
                ? confirmDelete ? "Xác nhận xóa tài khoản" : "Xóa tài khoản"
                : "Áp dụng xử lý"}
          </Button>
        </section>
      </div>

      {/* Lịch sử vi phạm */}
      <section className="mt-6 bg-surface rounded-2xl border border-border shadow-sm p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Lịch sử vi phạm ({violations.length})</h2>
        {violations.length === 0 ? (
          <p className="text-sm text-muted">Chưa có xử lý nào — người dùng sạch.</p>
        ) : (
          <ul className="space-y-3">
            {violations.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-4 border-b border-border last:border-0 pb-3 last:pb-0">
                <div>
                  <p className="font-semibold text-foreground text-sm">{ACTION_LABEL[v.action]}</p>
                  <p className="text-sm text-muted">{v.reason}</p>
                </div>
                <div className="text-right text-xs text-muted shrink-0">
                  <p>{new Date(v.createdAt).toLocaleString("vi-VN")}</p>
                  <p>bởi {v.admin.displayName}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast}
    </div>
  );
}
