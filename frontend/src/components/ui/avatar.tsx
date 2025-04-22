import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  initials?: string
  size?: "sm" | "md" | "lg" | "xl"
  status?: "online" | "offline" | "away" | "busy" | "none"
  ring?: boolean
  ringColor?: string
}

const Avatar: React.FC<AvatarProps> = ({ 
  className, 
  src, 
  alt = "", 
  initials,
  size = "md", 
  status = "none",
  ring = false,
  ringColor = "teal", 
  ...props 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm": return "w-8 h-8 text-xs";
      case "lg": return "w-12 h-12 text-base";
      case "xl": return "w-16 h-16 text-lg";
      default: return "w-10 h-10 text-sm";
    }
  };

  const getStatusClasses = () => {
    switch (status) {
      case "online": return "bg-teal";
      case "offline": return "bg-text-muted";
      case "away": return "bg-warning";
      case "busy": return "bg-error";
      default: return "hidden";
    }
  };

  const getRingClasses = () => {
    if (!ring) return "";
    
    switch (ringColor) {
      case "teal": return "ring-2 ring-teal";
      case "orange": return "ring-2 ring-gradient-orange";
      case "error": return "ring-2 ring-error";
      default: return "ring-2 ring-border-focus";
    }
  };

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center bg-background-tertiary",
        getSizeClasses(),
        getRingClasses(),
        className
      )} 
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-text-secondary">
          {initials || alt.substring(0, 2).toUpperCase()}
        </span>
      )}
      
      {status !== "none" && (
        <span className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-card",
          size === "sm" ? "w-2 h-2" : "w-3 h-3",
          getStatusClasses()
        )} />
      )}
    </div>
  )
}

export { Avatar } 