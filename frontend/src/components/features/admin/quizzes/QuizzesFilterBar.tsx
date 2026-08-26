import * as React from "react";
import { Filter, Search } from "lucide-react";

interface QuizzesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedLang: string;
  onLangChange: (value: string) => void;
  selectedLevel: string;
  onLevelChange: (value: string) => void;
}

export function QuizzesFilterBar({
  search,
  onSearchChange,
  selectedLang,
  onLangChange,
  selectedLevel,
  onLevelChange,
}: QuizzesFilterBarProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs md:flex-row">
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Tìm theo tên bộ đề, chủ đề..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
        <Filter className="hidden h-4 w-4 text-muted sm:block" />
        <select
          value={selectedLang}
          onChange={(e) => onLangChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
        >
          <option value="ALL">Tất cả Ngôn ngữ</option>
          <option value="Tiếng Anh">Tiếng Anh</option>
          <option value="Tiếng Nhật">Tiếng Nhật</option>
          <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
          <option value="Tiếng Pháp">Tiếng Pháp</option>
          <option value="Tiếng Đức">Tiếng Đức</option>
          <option value="Tiếng Trung">Tiếng Trung</option>
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => onLevelChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
        >
          <option value="ALL">Tất cả Trình độ</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
        </select>
      </div>
    </div>
  );
}
