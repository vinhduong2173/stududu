"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface WorldMapBannerProps {
  className?: string;
}

export function WorldMapBanner({ className }: WorldMapBannerProps) {
  return (
    <div
      className={cn(
        "relative w-full h-52 sm:h-64 md:h-76 lg:h-84 overflow-hidden bg-[#e5f2f6] dark:bg-[#0c1420] border-b border-border/60 select-none",
        className,
      )}
    >
      <img
        src="/images/profile-banner.png"
        alt="World Map Profile Banner"
        className="w-full h-full object-cover object-center pointer-events-none"
      />
    </div>
  );
}
