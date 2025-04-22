// src/components/ui/progress.tsx
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value?: number;
  max?: number;
  variant?: "default" | "positive" | "negative" | "warning";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  animate?: boolean;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0, 
  max = 100,
  variant = "default", 
  size = "md",
  showValue = false,
  animate = true,
  className,
  ...props
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getSizeClass = () => {
    switch (size) {
      case "sm": return "h-1";
      case "lg": return "h-3";
      default: return "h-2";
    }
  };
  
  const getIndicatorColor = () => {
    switch (variant) {
      case "positive":
        return "bg-teal";
      case "negative":
        return "bg-error";
      case "warning":
        return "bg-warning";
      default:
        return "bg-teal";
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-background-tertiary",
          getSizeClass(),
          className
        )}
        {...props}
      >
        <motion.div
          className={cn("h-full rounded-full", getIndicatorColor())}
          style={animate ? {} : { width: `${percentage}%` }}
          initial={animate ? { width: 0 } : {}}
          animate={animate ? { width: `${percentage}%` } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {showValue && (
        <div className="mt-1 text-right text-sm text-text-secondary">
          {value}/{max}
        </div>
      )}
    </div>
  );
};

export { Progress };