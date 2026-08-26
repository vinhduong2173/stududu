import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Step4PublishSummaryProps {
  title: string;
  language: string;
  level: string;
  topic: string;
  rowsCount: number;
  isSubmitting: boolean;
  onPrev: () => void;
  onPublish: () => void;
}

export function Step4PublishSummary({
  title,
  language,
  level,
  topic,
  rowsCount,
  isSubmitting,
  onPrev,
  onPublish,
}: Step4PublishSummaryProps) {
  const canPublish = Boolean(language && level && topic && rowsCount > 0);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xs md:p-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Bước 4 — Phát hành bộ đề
        </h2>
        <p className="mt-1 text-sm text-muted">
          Xem lại thông tin tổng thể và bấm phát hành để đăng bộ đề lên ứng dụng cho học viên làm bài.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-foreground">
              {title || (topic && level ? `${topic} — ${level}` : "Bộ đề mới")}
            </h3>
            <p className="text-xs text-muted">
              Ngôn ngữ: {language || "Chưa chọn"} · Trình độ: {level || "Chưa chọn"}
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
            {rowsCount} câu hỏi
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-muted">Chủ đề bài thi:</span>
            <span className="font-semibold text-foreground">{topic || "Chưa chọn"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Trạng thái phát hành:</span>
            <span className="font-bold text-emerald-600">
              {rowsCount > 0 ? "Sẵn sàng (Active)" : "Chưa có câu hỏi"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={onPrev} className="rounded-xl px-5">
          ← Quay lại
        </Button>
        <Button
          disabled={!canPublish || isSubmitting}
          onClick={onPublish}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isSubmitting ? "Đang phát hành..." : "Hoàn tất & Đăng bộ đề"}
        </Button>
      </div>
    </div>
  );
}
