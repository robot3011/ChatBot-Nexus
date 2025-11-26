import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface AvatarProps {
  type: "user" | "ai";
  name?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ type, name, imageUrl, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const getInitials = (name?: string) => {
    if (!name) return type === "user" ? "U" : "N";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full flex-shrink-0",
        type === "ai" ? "gradient-ai glow-primary" : "gradient-user",
        sizeClasses[size],
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || "Avatar"}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <>
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          
          {type === "ai" ? (
            <Bot size={iconSizes[size]} className="relative text-primary-foreground" />
          ) : (
            <span className="relative font-semibold text-white text-sm">
              {getInitials(name)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
