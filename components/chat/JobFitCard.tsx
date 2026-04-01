"use client";

import React from "react";
import { JobFitResult } from "@/types/resume";

export function JobFitCard({ fit }: { fit: JobFitResult }) {
  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden bg-paper">
      <div className="px-3 py-2 border-b border-border bg-sage-light/30">
        <p className="text-[10px] font-mono text-sage uppercase tracking-wide">Job fit</p>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-sage">{fit.overallFit}</span>
          <span className="text-sm text-ink-faint font-mono">/100</span>
        </div>
        {fit.strengths?.length ? (
          <div>
            <p className="text-[9px] font-medium text-sage mb-1">Strengths</p>
            <ul className="space-y-0.5">
              {fit.strengths.map((s, i) => (
                <li key={i} className="text-[10px] text-ink ink-dot pl-1">{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {fit.gaps?.length ? (
          <div>
            <p className="text-[9px] font-medium text-danger mb-1">Gaps</p>
            <ul className="space-y-0.5">
              {fit.gaps.map((g, i) => (
                <li key={i} className="text-[10px] text-danger/90 pl-2 border-l-2 border-danger/30">{g}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {fit.verdict && (
          <p className="text-xs text-ink-muted italic border-t border-border pt-2">{fit.verdict}</p>
        )}
      </div>
    </div>
  );
}
