"use client";

import * as React from "react";
import { CalendarClock, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TIME_SLOTS, convertSlot } from "@/lib/timezones";

/** FS-28 — Hẹn giờ trò chuyện: chọn ngày + giờ cụ thể (lưu UTC — BR-15).
 *  Mỗi bên xem giờ theo timezone trình duyệt của mình; khung giờ rảnh của đối tác
 *  chỉ hiển thị làm gợi ý. */

export function ScheduleChatModal({
  open,
  onClose,
  partnerName,
  partnerFlag,
  partnerOffset,
  myOffset,
  partnerSlotIds,
  onSchedule,
}: {
  open: boolean;
  onClose: () => void;
  partnerName: string;
  partnerFlag: string;
  partnerOffset: number;
  myOffset: number;
  partnerSlotIds: string[];
  onSchedule: (timeUtcIso: string) => void | Promise<void>;
}) {
  const [dateStr, setDateStr] = React.useState("");
  const [timeStr, setTimeStr] = React.useState("20:00");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setDateStr(tomorrow.toISOString().slice(0, 10));
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const partnerSlots = TIME_SLOTS.filter((s) => partnerSlotIds.includes(s.id));
  // Bản xem trước theo giờ địa phương của trình duyệt
  const localPreview = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}`) : null;

  const handleConfirm = async () => {
    if (!localPreview || Number.isNaN(localPreview.getTime())) {
      setError("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }
    if (localPreview.getTime() <= Date.now()) {
      setError("Thời gian hẹn phải ở tương lai.");
      return;
    }
    setSubmitting(true);
    try {
      // new Date(local string) → toISOString = UTC (BR-15)
      await onSchedule(localPreview.toISOString());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Hẹn giờ trò chuyện</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="rounded-xl bg-error/10 p-3 text-sm text-error">{error}</div>}

          {partnerSlots.length > 0 && (
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3 text-xs text-muted">
              <p className="font-bold text-primary mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Gợi ý — khung giờ rảnh của {partnerName}:
              </p>
              {partnerSlots.map((s) => (
                <p key={s.id} className="text-foreground font-medium">
                  {s.label} ({partnerFlag}) = {convertSlot(s, partnerOffset, myOffset)} (giờ bạn)
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">Ngày</label>
              <input
                type="date"
                value={dateStr}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-border bg-transparent px-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">Giờ (giờ của bạn)</label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-border bg-transparent px-3 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {localPreview && !Number.isNaN(localPreview.getTime()) && (
            <p className="text-xs text-muted">
              🕐 Bạn mời lúc{" "}
              <span className="font-semibold text-foreground">
                {localPreview.toLocaleString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>{" "}
              — {partnerName} sẽ thấy theo múi giờ của họ. Lời mời tự hết hạn sau 48h nếu không phản hồi.
            </p>
          )}

          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
            <CalendarClock className="w-4 h-4 mr-2" /> {submitting ? "Đang gửi..." : "Gửi lời mời"}
          </Button>
        </div>
      </div>
    </div>
  );
}
