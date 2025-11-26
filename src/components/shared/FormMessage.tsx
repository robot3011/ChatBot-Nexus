import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface FormMessageProps {
  type: "error" | "success";
  message: string;
  className?: string;
}

export function FormMessage({ type, message, className }: FormMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg text-sm animate-fade-in",
        type === "error"
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-success/10 text-success border border-success/20",
        className
      )}
      role="alert"
    >
      {type === "error" ? (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
