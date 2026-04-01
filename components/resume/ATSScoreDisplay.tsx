"use client";

import React from "react";
import { ATSScoreResult } from "@/types/resume";

export function ATSScoreDisplay({ ats }: { ats: ATSScoreResult }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (ats.score / 100) * c;

  return (
    <div className="border border-border rounded-md p-4 space-y-3">
      <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">ATS compatibility</p>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={r} fill="none" stroke="#E2DFD8" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="#6B8F71"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-ink">{ats.score}</span>
            <span className="text-[8px] font-mono text-ink-faint">/100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-2 text-xs">
          {ats.presentKeywords?.length ? (
            <div>
              <p className="text-[9px] font-medium text-sage mb-1">Strong matches</p>
              <div className="flex flex-wrap gap-1">
                {ats.presentKeywords.slice(0, 12).map((k) => (
                  <span key={k} className="text-[9px] px-1.5 py-px rounded-sm bg-sage-light text-sage-dark border border-sage/20">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {ats.missingKeywords?.length ? (
            <div>
              <p className="text-[9px] font-medium text-danger mb-1">Missing keywords</p>
              <div className="flex flex-wrap gap-1">
                {ats.missingKeywords.slice(0, 10).map((k) => (
                  <span key={k} className="text-[9px] px-1.5 py-px rounded-sm bg-danger-light text-danger border border-danger/20">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {ats.suggestions?.length ? (
        <div>
          <p className="text-[9px] font-medium text-ink-muted uppercase tracking-wide mb-1.5">Suggestions</p>
          <ul className="space-y-1">
            {ats.suggestions.map((s, i) => (
              <li key={i} className="ink-dot text-[10px] text-ink-muted pl-1">{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
