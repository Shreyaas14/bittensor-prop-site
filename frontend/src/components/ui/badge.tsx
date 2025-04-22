import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "bg-teal-bg text-teal border border-teal/30",
        secondary:
          "bg-background-tertiary text-text-secondary border border-border",
        destructive:
          "bg-error-bg text-error border border-error/30",
        outline:
          "border border-border text-text-secondary",
        warning:
          "bg-warning-bg text-warning border border-warning/30",
        ghost:
          "bg-transparent text-text-secondary hover:bg-background-tertiary",
        glass:
          "bg-white/5 backdrop-blur-md border border-white/10 text-white",
      },
      size: {
        default: "text-xs py-0.5 px-2.5",
        sm: "text-[10px] py-px px-2",
        lg: "text-sm py-1 px-3",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants } 