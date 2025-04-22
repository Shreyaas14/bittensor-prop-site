// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium relative overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-teal text-black shadow-sm hover:bg-teal-hover hover:shadow-[0_0_20px_rgba(0,219,188,0.4)] active:scale-[0.98] after:content-[''] after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        destructive:
          "bg-error text-white shadow-sm hover:bg-error-dark hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] active:scale-[0.98] after:content-[''] after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        outline:
          "border border-border bg-transparent shadow-sm hover:border-teal hover:text-teal hover:shadow-[0_0_15px_rgba(0,219,188,0.2)] text-white active:scale-[0.98]",
        secondary:
          "bg-background-tertiary text-white shadow-sm border border-border hover:border-border-hover hover:bg-card hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:scale-[0.98]",
        ghost: 
          "hover:bg-card hover:text-teal active:scale-[0.98]",
        link: 
          "text-teal underline-offset-4 hover:underline hover:text-teal-light p-0 h-auto",
        glass:
          "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2.5 text-button-md",
        sm: "h-8 rounded-md px-3 py-1.5 text-button-sm",
        lg: "h-12 rounded-md px-8 py-3 text-button-lg",
        icon: "h-10 w-10 rounded-full",
        pill: "h-10 px-6 rounded-full",
      },
      width: {
        default: "",
        full: "w-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, width, asChild = false, icon, iconPosition = "left", loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, width, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {icon && iconPosition === "left" && !loading && <span className="mr-1">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className="ml-1">{icon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }