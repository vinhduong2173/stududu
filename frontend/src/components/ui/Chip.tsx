import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-teal-50 text-teal-800 border border-teal-200/60 hover:bg-teal-100/70",
        secondary: "bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100/70",
        outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
        active: "bg-primary text-white border border-primary shadow-2xs",
        success: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  active?: boolean;
}

function Chip({ className, variant, active, ...props }: ChipProps) {
  return (
    <div
      className={cn(chipVariants({ variant: active ? "active" : variant }), className)}
      {...props}
    />
  )
}

export { Chip, chipVariants }
