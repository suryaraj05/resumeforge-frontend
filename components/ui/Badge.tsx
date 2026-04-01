import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "sage" | "muted" | "danger";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  onRemove?: () => void;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-border/50 text-ink-muted border border-border",
  sage: "bg-sage-light text-sage-dark border border-sage/20",
  muted: "bg-ink/5 text-ink-muted border border-border",
  danger: "bg-danger-light text-danger border border-danger/20",
};

export function Badge({ children, variant = "default", className, onRemove }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-sm",
        variantClasses[variant],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-ink-faint hover:text-ink transition-colors"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
