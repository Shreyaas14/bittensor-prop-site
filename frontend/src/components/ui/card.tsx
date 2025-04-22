import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  interactive?: boolean
  variant?: "default" | "bordered" | "glass" | "flat"
  highlight?: "none" | "teal" | "orange" | "error" | "warning"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, interactive = false, variant = "default", highlight = "none", children, ...props }, ref) => {
    const getHighlightClasses = () => {
      switch (highlight) {
        case "teal":
          return "border-teal/30 hover:border-teal/70 hover:shadow-[0_0_20px_rgba(0,219,188,0.2)]";
        case "orange":
          return "border-gradient-orange/30 hover:border-gradient-orange/70 hover:shadow-[0_0_20px_rgba(255,139,37,0.2)]";
        case "error":
          return "border-error/30 hover:border-error/70 hover:shadow-[0_0_20px_rgba(229,57,53,0.2)]";
        case "warning":
          return "border-warning/30 hover:border-warning/70 hover:shadow-[0_0_20px_rgba(255,139,37,0.2)]";
        default:
          return "border-border hover:border-border-hover";
      }
    };

    const getVariantClasses = () => {
      switch (variant) {
        case "bordered":
          return "bg-transparent border-2";
        case "glass":
          return "bg-white/5 backdrop-blur-md border border-white/10";
        case "flat":
          return "bg-background-tertiary border-none shadow-none";
        default:
          return "bg-card border border-border";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-300",
          getVariantClasses(),
          highlight !== "none" && getHighlightClasses(),
          hoverable && "hover:shadow-lg hover:transform hover:translate-y-[-3px]",
          interactive && "cursor-pointer active:scale-[0.99]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-header-sm font-medium leading-none tracking-tight text-text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-label-md text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Enhanced StatCard with animation
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  highlight?: "none" | "teal" | "orange";
  animate?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, prefix, suffix, trend, highlight = "none", animate = true, ...props }, ref) => {
    const getHighlightClasses = () => {
      switch (highlight) {
        case "teal":
          return "bg-teal-bg border-teal/30 hover:border-teal";
        case "orange":
          return "bg-warning-bg border-gradient-orange/30 hover:border-gradient-orange";
        default:
          return "bg-background-tertiary border-border hover:border-border-hover";
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex flex-col rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
          getHighlightClasses(),
          className
        )}
        whileHover={animate ? { y: -4, transition: { duration: 0.2 } } : {}}
        {...props}
      >
        <div className="flex justify-between items-baseline mb-2">
          <div className="text-label-md text-text-secondary">{label}</div>
          {trend && (
            <div className={`flex items-center text-sm px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-teal-bg text-teal' : 'bg-error-bg text-error'
            }`}>
              <span className="mr-1">{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="flex items-baseline">
          {prefix && <span className="text-header-sm mr-1 text-text-secondary">{prefix}</span>}
          <motion.span 
            className="text-display-sm font-medium text-text-primary"
            initial={animate ? { opacity: 0, y: 10 } : {}}
            animate={animate ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {value}
          </motion.span>
          {suffix && <span className="text-header-sm ml-1 text-text-secondary">{suffix}</span>}
        </div>
      </motion.div>
    );
  }
);
StatCard.displayName = "StatCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  StatCard 
};