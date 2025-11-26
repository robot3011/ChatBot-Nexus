import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl gradient-ai glow-primary",
          sizeClasses[size]
        )}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* N letter */}
        <span className="relative font-bold text-primary-foreground" style={{ fontSize: size === "lg" ? "1.5rem" : size === "md" ? "1.25rem" : "1rem" }}>
          N
        </span>
      </div>

      {showText && (
        <span className={cn("font-bold gradient-text", textSizeClasses[size])}>
          Nexus
        </span>
      )}
    </div>
  );
}
