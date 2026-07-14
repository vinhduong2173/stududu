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
            "flex h-12 w-full rounded-xl border border-border bg-transparent px-4 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:ring-error focus-visible:border-error",
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
