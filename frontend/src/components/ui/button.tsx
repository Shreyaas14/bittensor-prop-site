// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-teal text-black shadow-sm hover:bg-teal/90 hover:shadow-[0_0_12px_rgba(0,219,188,0.35)]",
        destructive:
          "bg-gradient-orange text-white shadow-sm hover:bg-gradient-orange/90 hover:shadow-[0_0_12px_rgba(255,139,37,0.35)]",
        outline:
          "border border-white bg-transparent shadow-sm hover:bg-white/10 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] hover:border-white/90 text-white",
        secondary:
          "bg-[#272727] text-white shadow-sm hover:bg-[#323232] hover:shadow-[0_0_12px_rgba(50,50,50,0.4)]",
        ghost: "hover:bg-card hover:text-white",
        link: "text-teal underline-offset-4 hover:underline hover:text-teal/90",
      },
      size: {
        default: "h-9 px-4 py-2 text-button-md",
        sm: "h-8 rounded-md px-3 text-button-sm",
        lg: "h-10 rounded-md px-8 text-button-lg",
        icon: "h-9 w-9",
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

// Fixed button component using CSS for animations instead of framer-motion
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