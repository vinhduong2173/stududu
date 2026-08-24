"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuestionSetSettingsCardProps {
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editTimePerQuestionSec: number;
  setEditTimePerQuestionSec: (val: number) => void;
  editMaxAttempts: number;
  setEditMaxAttempts: (val: number) => void;
  editStartsAt: string;
  setEditStartsAt: (val: string) => void;
  editEndsAt: string;
  setEditEndsAt: (val: string) => void;
  saveSuccess: boolean;
  busy: boolean;
  onSave: () => void;
}

export function QuestionSetSettingsCard({
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editTimePerQuestionSec,
  setEditTimePerQuestionSec,
  editMaxAttempts,
  setEditMaxAttempts,
  editStartsAt,
  setEditStartsAt,
  editEndsAt,
  setEditEndsAt,
  saveSuccess,
  busy,
  onSave,
}: QuestionSetSettingsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-xs">
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã lưu cấu hình bộ đề thành công!</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="font-bold text-foreground text-base">Cấu hình & Giới hạn bài test</h2>
          <p className="text-xs text-muted mt-0.5">Thiết lập thời gian làm bài, số lần làm bài và khoảng ngày cho phép thí sinh làm bài.</p>
        </div>
        <Button
          size="sm"
          disabled={busy}
          onClick={onSave}
          className="bg-primary text-primary-foreground font-bold text-xs rounded-xl px-5 py-2 shadow-xs"
        >
          Lưu cấu hình
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Tiêu đề bộ đề
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Mô tả
          </label>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Thời gian cho mỗi câu hỏi
          </label>
          <select
            value={editTimePerQuestionSec}
            onChange={(e) => setEditTimePerQuestionSec(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10 giây / câu (Rất nhanh)</option>
            <option value={15}>15 giây / câu (Tiêu chuẩn)</option>
            <option value={20}>20 giây / câu (Trung bình)</option>
            <option value={30}>30 giây / câu (Thoải mái)</option>
            <option value={60}>60 giây / câu (Nâng cao/Đọc hiểu)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Giới hạn số lần làm bài
          </label>
          <select
            value={editMaxAttempts}
            onChange={(e) => setEditMaxAttempts(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={0}>Không giới hạn</option>
            <option value={1}>1 lần duy nhất</option>
            <option value={2}>2 lần</option>
            <option value={3}>3 lần</option>
            <option value={5}>5 lần</option>
            <option value={10}>10 lần</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Ngày bắt đầu <span className="text-muted font-normal">(tùy chọn)</span>
          </label>
          <input
            type="date"
            value={editStartsAt}
            onChange={(e) => setEditStartsAt(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Ngày kết thúc <span className="text-muted font-normal">(tùy chọn)</span>
          </label>
          <input
            type="date"
            value={editEndsAt}
            onChange={(e) => setEditEndsAt(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
