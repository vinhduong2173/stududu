import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover shadow-[0_2px_8px_-2px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(124,58,237,0.4)]",
        secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-[0_2px_8px_-2px_rgba(255,77,109,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(255,77,109,0.4)]",
        ghost: "border border-border/80 bg-surface/60 text-foreground hover:bg-surface-2 hover:border-border-strong text-foreground",
        outline: "border border-border text-foreground hover:bg-surface-2 hover:border-border-strong bg-transparent",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-xl px-7 text-base font-bold",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
