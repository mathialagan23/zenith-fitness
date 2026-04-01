import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  className?: string;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: "border-neon-green/30 bg-neon-green/5 text-neon-green",
  error: "border-neon-red/30 bg-neon-red/5 text-neon-red",
  warning: "border-neon-yellow/30 bg-neon-yellow/5 text-neon-yellow",
  info: "border-neon-blue/30 bg-neon-blue/5 text-neon-blue",
};

export function Alert({ type = "info", title, message, className }: AlertProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        styles[type],
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  );
}
