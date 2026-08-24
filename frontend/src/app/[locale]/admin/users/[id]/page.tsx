"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/features/TrustDialogs";
import { AdminUserDetailCard, UserDetail } from "@/components/features/admin/users/AdminUserDetailCard";
import { AdminUserModerationCard, Violation } from "@/components/features/admin/users/AdminUserModerationCard";
import { AdminUserViolationsCard } from "@/components/features/admin/users/AdminUserViolationsCard";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? parseInt(params.id) : 0;
  const { show: showToast, toast } = useToast();

  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [violations, setViolations] = React.useState<Violation[]>([]);
  const [error, setError] = React.useState("");

  const [action, setAction] = React.useState<Violation["action"]>("warn");
  const [reason, setReason] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const load = React.useCallback(() => {
    if (!id) return;
    Promise.all([api<UserDetail>(`/admin/users/${id}`), api<Violation[]>(`/admin/users/${id}/violations`)])
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
    if (action === "hard_delete" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api(`/admin/users/${id}/moderate`, { method: "POST", body: { action, reason: reason.trim() } });
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
  if (!user) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-2 transition-colors hover:bg-muted/10">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Chi tiết người dùng</h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <AdminUserDetailCard user={user} />
        <div className="space-y-6">
          <AdminUserModerationCard
            user={user}
            violations={violations}
            action={action}
            setAction={setAction}
            reason={reason}
            setReason={setReason}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            formError={formError}
            submitting={submitting}
            onModerate={handleModerate}
          />
          <AdminUserViolationsCard violations={violations} />
        </div>
      </div>
      {toast}
    </div>
  );
}
