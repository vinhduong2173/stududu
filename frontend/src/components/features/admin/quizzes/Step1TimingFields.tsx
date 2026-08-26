import * as React from "react";

interface Step1TimingFieldsProps {
  timePerQuestionSec: number;
  setTimePerQuestionSec: (val: number) => void;
  maxAttempts: number;
  setMaxAttempts: (val: number) => void;
  startsAt: string;
  setStartsAt: (val: string) => void;
  endsAt: string;
  setEndsAt: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
}

export function Step1TimingFields({
  timePerQuestionSec,
  setTimePerQuestionSec,
  maxAttempts,
  setMaxAttempts,
  startsAt,
  setStartsAt,
  endsAt,
  setEndsAt,
  description,
  setDescription,
}: Step1TimingFieldsProps) {
  return (
    <>
      {/* Thời gian / câu */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Thời gian mỗi câu (giây) ⏱️
        </label>
        <select
          value={timePerQuestionSec}
          onChange={(e) => setTimePerQuestionSec(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={10}>10 giây / câu (Nhanh)</option>
          <option value={15}>15 giây / câu (Chuẩn)</option>
          <option value={20}>20 giây / câu</option>
          <option value={30}>30 giây / câu</option>
          <option value={60}>60 giây / câu</option>
        </select>
      </div>

      {/* Giới hạn số lần */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Giới hạn số lần làm bài 🎯
        </label>
        <select
          value={maxAttempts}
          onChange={(e) => setMaxAttempts(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={0}>Không giới hạn</option>
          <option value={1}>1 lần duy nhất</option>
          <option value={2}>2 lần</option>
          <option value={3}>3 lần</option>
          <option value={5}>5 lần</option>
          <option value={10}>10 lần</option>
        </select>
      </div>

      {/* Ngày bắt đầu */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Ngày bắt đầu 📅 <span className="font-normal text-muted">(tùy chọn)</span>
        </label>
        <input
          type="date"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Ngày kết thúc */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Ngày kết thúc ⏳ <span className="font-normal text-muted">(tùy chọn)</span>
        </label>
        <input
          type="date"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Mô tả */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Mô tả <span className="font-normal text-muted">(tùy chọn)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Giới thiệu ngắn về bộ đề..."
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </>
  );
}
