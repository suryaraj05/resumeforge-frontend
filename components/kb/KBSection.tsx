"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface KBSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  empty?: boolean;
  children: React.ReactNode;
}

export function KBSection({
  title,
  count,
  defaultOpen = false,
  empty = false,
  children,
}: KBSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-sage-light/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink uppercase tracking-wide">
            {title}
          </span>
          {count !== undefined && (
            <span className="text-[10px] font-mono text-ink-faint bg-border/50 px-1.5 py-px rounded-sm">
              {count}
            </span>
          )}
          {empty && (
            <span className="text-[10px] text-ink-faint">— not found</span>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn(
            "text-ink-faint transition-transform duration-150",
            open && "rotate-180"
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 animate-fadeIn">
          {empty ? (
            <p className="text-xs text-ink-faint italic">
              No data extracted. You can add this later through chat.
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
