"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { Flag, ShieldBan } from "lucide-react";

/** MÀN 13 — Báo cáo & Chặn (US-17, US-18). Dùng chung cho hồ sơ đối tác + chat. */

const REPORT_REASONS = [
  "Spam / quảng cáo",
  "Quấy rối",
  "Nội dung không phù hợp",
  "Hồ sơ giả",
  "Khác",
];

function DialogShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ReportDialog({
  open,
  onClose,
  targetId,
  targetName,
  targetType,
  targetContentId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  /** user bị báo cáo (chủ nội dung khi report post/word) */
  targetId: number;
  targetName: string;
  /** FS-24/25 — report nội dung: 'post' | 'word_library' */
  targetType?: "post" | "word_library";
  targetContentId?: number;
  onDone?: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async () => {
    if (!reason) {
      setError("Vui lòng chọn lý do báo cáo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fullReason = note.trim() ? `${reason} — ${note.trim()}` : reason;
      await api("/reports", {
        method: "POST",
        body: {
          reportedId: targetId,
          reason: fullReason,
          ...(targetType ? { targetType, targetId: targetContentId } : {}),
        },
      });
      onClose();
      setReason("");
      setNote("");
      onDone?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogShell open={open} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
          <Flag className="h-5 w-5 text-warning" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Báo cáo {targetName}</h2>
      </div>

      {error && <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">{error}</div>}

      <div className="space-y-2 mb-4">
        {REPORT_REASONS.map((r) => (
          <label
            key={r}
            className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="report-reason"
              className="accent-primary h-4 w-4"
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            <span className="text-sm font-medium text-foreground">{r}</span>
          </label>
        ))}
      </div>

      <textarea
        className="w-full rounded-xl border border-border bg-transparent p-3 text-sm outline-none focus:border-primary resize-none h-20 mb-4"
        placeholder="Ghi chú thêm (không bắt buộc)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi báo cáo"}
        </Button>
      </div>
    </DialogShell>
  );
}

export function BlockDialog({
  open,
  onClose,
  targetId,
  targetName,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  targetId: number;
  targetName: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleBlock = async () => {
    setLoading(true);
    setError("");
    try {
      await api(`/blocks/${targetId}`, { method: "POST" });
      onClose();
      onDone?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogShell open={open} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center">
          <ShieldBan className="h-5 w-5 text-error" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Chặn {targetName}?</h2>
      </div>

      {error && <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">{error}</div>}

      <p className="text-muted text-sm mb-6">
        Người này sẽ không nhắn tin hay nhìn thấy bạn trong Khám phá nữa. Bạn có thể bỏ chặn trong
        Cài đặt.
      </p>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          className="flex-1 bg-error hover:bg-error/90"
          onClick={handleBlock}
          disabled={loading}
        >
          {loading ? "Đang chặn..." : "Chặn"}
        </Button>
      </div>
    </DialogShell>
  );
}

/** Toast tối giản dùng chung (success). Tự ẩn sau 2.5s. */
export function useToast() {
  const [message, setMessage] = React.useState("");

  const show = React.useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(""), 2500);
  }, []);

  const toast = message ? (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-foreground text-background text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {message}
    </div>
  ) : null;

  return { show, toast };
}
