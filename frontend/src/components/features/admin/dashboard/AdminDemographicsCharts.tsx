"use client";

import * as React from "react";
import { Globe, GraduationCap } from "lucide-react";
import { DemographicItem } from "@/hooks/useAdminDashboard";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#0D766E", // Teal
  "#0284C7", // Marine Blue
  "#E11D48", // Coral Rose
  "#D97706", // Honey Amber
  "#10B981", // Emerald
  "#8B5CF6", // Purple
];

interface PieChartCardProps {
  title: string;
  icon: React.ElementType;
  data: DemographicItem[];
  emptyText: string;
}

function PieChartCard({ title, icon: Icon, data, emptyText }: PieChartCardProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Build SVG Donut slices
  let cumulativePercent = 0;
  const slices = data.map((item, idx) => {
    const percent = total > 0 ? (item.count / total) * 100 : 0;
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * 360;
    const color = PALETTE[idx % PALETTE.length];

    return { ...item, percent, startAngle, endAngle, color };
  });

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 shadow-xs">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Icon className="h-4 w-4 text-primary" /> {title}
          </h2>
          <span className="text-xs font-semibold text-muted">{total} lượt đăng ký</span>
        </div>

        {total === 0 || data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{emptyText}</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative h-44 w-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                {slices.map((slice, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const strokeWidth = isHovered ? 20 : 16;
                  const radius = 38;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((slice.startAngle / 360) * circumference);

                  return (
                    <circle
                      key={slice.name}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-extrabold text-foreground tracking-tight">
                  {hoveredIndex !== null ? `${slices[hoveredIndex]?.percent.toFixed(0)}%` : total}
                </span>
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider truncate max-w-[80px]">
                  {hoveredIndex !== null ? slices[hoveredIndex]?.name : "Tổng số"}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2">
              {slices.map((slice, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <div
                    key={slice.name}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "flex items-center justify-between p-1.5 rounded-xl transition-colors text-xs cursor-pointer",
                      isHovered ? "bg-muted/15 font-semibold" : "hover:bg-muted/10",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="truncate text-foreground font-medium">{slice.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-foreground">{slice.count}</span>
                      <span className="text-muted text-[11px] w-10 text-right">({slice.percent.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDemographicsCharts({
  userOrigins = [],
  learningLanguages = [],
}: {
  userOrigins?: DemographicItem[];
  learningLanguages?: DemographicItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PieChartCard
        title="Người dùng đến từ đâu (Bản ngữ)"
        icon={Globe}
        data={userOrigins}
        emptyText="Chưa có dữ liệu nguồn gốc người dùng."
      />
      <PieChartCard
        title="Các ngôn ngữ người dùng đang học"
        icon={GraduationCap}
        data={learningLanguages}
        emptyText="Chưa có dữ liệu ngôn ngữ đang học."
      />
    </div>
  );
}
