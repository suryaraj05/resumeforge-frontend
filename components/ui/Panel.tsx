import React from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  as?: React.ElementType;
}

export function Panel({ children, className, padding = true, as: Tag = "div" }: PanelProps) {
  return (
    <Tag
      className={cn(
        "paper-panel",
        padding && "p-6",
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, subtitle, action, className }: PanelHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
