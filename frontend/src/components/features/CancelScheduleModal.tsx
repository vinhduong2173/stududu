"use client";

import * as React from "react";
import { CalendarX, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export function CancelScheduleModal({
  open,
  onClose,
  onCancel,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: string) => void;
  loading: boolean;
}) {
  const t = useTranslations("chat");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onCancel(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarX className="w-5 h-5 text-error shrink-0" />
            <h2 className="font-bold text-foreground">{t("cancel_modal_title") || "Hủy lịch hẹn"}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              {t("cancel_modal_placeholder") || "Nhập lý do hủy lịch hẹn..."}
            </label>
            <textarea
              className="w-full h-28 rounded-xl border-2 border-border p-3 text-sm focus:outline-none focus:border-error bg-surface text-foreground placeholder-muted-foreground resize-none"
              placeholder={t("cancel_modal_placeholder") || "Nhập lý do..."}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              maxLength={200}
            />
            <div className="text-right text-[10px] text-muted-foreground">
              {reason.length}/200
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="rounded-full px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading || !reason.trim()}
              className="rounded-full px-5 bg-error hover:bg-error/90 text-white"
            >
              {loading ? "..." : (t("cancel") || "Hủy hẹn")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
