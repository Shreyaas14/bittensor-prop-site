import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
  label?: string
  description?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, label, description, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-input-placeholder focus-visible:outline-none focus-visible:border-teal focus-visible:ring-1 focus-visible:ring-teal/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
              icon && "pl-10",
              error && "border-error focus-visible:border-error focus-visible:ring-error/30",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        
        {description && !error && (
          <p className="mt-1.5 text-xs text-text-muted">
            {description}
          </p>
        )}
        
        {error && (
          <p className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input } 