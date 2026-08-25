import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-border/80 bg-surface-2/60 px-4 py-2 text-sm text-foreground transition-all placeholder:text-muted/70 focus-visible:outline-none focus-visible:bg-surface focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:ring-error/20 focus-visible:border-error",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-sm text-error font-medium">{error}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
