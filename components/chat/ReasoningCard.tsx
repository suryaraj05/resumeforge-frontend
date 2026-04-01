"use client";

import React, { useState } from "react";
import { RefinedResumeReasoning } from "@/types/resume";

export function ReasoningCard({ reasoning }: { reasoning: RefinedResumeReasoning }) {
  const [open, setOpen] = useState(false);
  const inc = reasoning.included ?? [];
  const exc = reasoning.excluded ?? [];
  if (!inc.length && !exc.length) return null;

  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-paper hover:bg-sage-light/20 transition-colors"
      >
        <span className="text-[10px] font-semibold text-ink uppercase tracking-wide">Why these items?</span>
        <span className="text-ink-faint">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border bg-paper max-h-48 overflow-y-auto">
          {inc.length > 0 && (
            <div>
              <p className="text-[9px] font-medium text-sage mb-1.5">Included</p>
              <ul className="space-y-1.5">
                {inc.map((e, i) => (
                  <li key={i} className="text-[10px]">
                    <span className="font-medium text-ink">{e.item}</span>
                    <span className="text-ink-muted"> — {e.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {exc.length > 0 && (
            <div>
              <p className="text-[9px] font-medium text-ink-faint mb-1.5">Left out</p>
              <ul className="space-y-1.5">
                {exc.map((e, i) => (
                  <li key={i} className="text-[10px] text-ink-muted">
                    <span className="font-medium text-ink">{e.item}</span>
                    <span> — {e.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
