"use client";

import React, { useState } from "react";
import type { ResumeDiffRow } from "@/types/resume";

export function ResumeDiffCard({ rows }: { rows: ResumeDiffRow[] }) {
  const [open, setOpen] = useState(true);
  if (!rows.length) return null;

  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-paper hover:bg-sage-light/20 transition-colors"
      >
        <span className="text-[10px] font-semibold text-ink uppercase tracking-wide">
          Changes vs previous resume ({rows.length})
        </span>
        <span className="text-ink-faint">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-border bg-paper">
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-border text-ink-faint font-mono uppercase">
                <th className="px-2 py-1.5 font-medium w-[22%]">Area</th>
                <th className="px-2 py-1.5 font-medium w-[39%]">Before</th>
                <th className="px-2 py-1.5 font-medium w-[39%]">After</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/70 align-top">
                  <td className="px-2 py-1.5 font-medium text-ink whitespace-nowrap">{r.area}</td>
                  <td className="px-2 py-1.5 text-red-700/90 break-words max-w-[200px]">{r.before}</td>
                  <td className="px-2 py-1.5 text-sage-dark break-words max-w-[200px]">{r.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
