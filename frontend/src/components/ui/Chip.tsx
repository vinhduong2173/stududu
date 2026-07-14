import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "bg-secondary/10 text-secondary hover:bg-secondary/20",
        outline: "border border-border text-foreground hover:bg-muted/10",
        active: "bg-primary text-white shadow-sm",
        success: "bg-success/10 text-success",
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
