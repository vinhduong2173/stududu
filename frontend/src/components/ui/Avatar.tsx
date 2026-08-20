import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback: string;
  online?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
}

const dotClasses = {
  sm: "h-2.5 w-2.5 border-2",
  md: "h-3.5 w-3.5 border-2",
  lg: "h-4 w-4 border-2",
  xl: "h-5 w-5 border-4",
}

export function Avatar({ src, fallback, online, size = "md", className, ...props }: AvatarProps) {
  return (
    <div className={cn("relative inline-flex shrink-0 select-none rounded-full", className)} {...props}>
      <div 
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full items-center justify-center bg-teal-600 text-white font-bold shadow-2xs",
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt="Avatar" className="aspect-square h-full w-full object-cover" />
        ) : (
          <span className="font-display font-semibold uppercase">{fallback}</span>
        )}
      </div>
      {online !== undefined && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-surface",
            dotClasses[size]
          )}
        >
          {online ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500" />
            </>
          ) : (
            <span className="inline-flex rounded-full h-full w-full bg-muted/60" />
          )}
        </span>
      )}
    </div>
  )
}
