// src/components/ui/progress.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value?: number;
  variant?: "default" | "positive" | "negative";
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0, 
  variant = "default", 
  className,
  ...props
}) => {
  const getIndicatorColor = () => {
    switch (variant) {
      case "positive":
        return "bg-chart-positive";
      case "negative":
        return "bg-chart-negative";
      default:
        return "bg-teal";
    }
  };

  return (
    <div
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-background-secondary",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all", getIndicatorColor())}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

export { Progress };