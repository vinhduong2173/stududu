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
    <div className={cn("relative inline-block", className)} {...props}>
      <div 
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold",
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt="Avatar" className="aspect-square h-full w-full object-cover" />
        ) : (
          <span>{fallback}</span>
        )}
      </div>
      {online !== undefined && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-surface",
            online ? "bg-success" : "bg-muted",
            dotClasses[size]
          )}
        />
      )}
    </div>
  )
}
