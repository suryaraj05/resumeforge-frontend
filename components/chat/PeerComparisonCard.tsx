"use client";

import React from "react";
import type { PeerComparisonResult } from "@/types/groups";

export function PeerComparisonCard({ result }: { result: PeerComparisonResult }) {
  return (
    <div className="mt-2 max-w-[90%] rounded-md border border-sage/25 bg-sage-light/30 px-3 py-3 text-xs text-ink space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-wide text-sage">
        Anonymous peer comparison
      </p>
      {result.userStrengths?.length ? (
        <div>
          <p className="font-semibold text-ink mb-1">Your strengths</p>
          <ul className="list-disc pl-4 space-y-0.5 text-ink-muted">
            {result.userStrengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.userGaps?.length ? (
        <div>
          <p className="font-semibold text-ink mb-1">Gaps vs. group</p>
          <ul className="list-disc pl-4 space-y-0.5 text-ink-muted">
            {result.userGaps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.groupAverageSkills?.length ? (
        <div>
          <p className="font-semibold text-ink mb-1">Common themes in the group</p>
          <ul className="list-disc pl-4 space-y-0.5 text-ink-muted">
            {result.groupAverageSkills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.recommendation ? (
        <p className="text-ink leading-relaxed border-t border-border/60 pt-2">
          {result.recommendation}
        </p>
      ) : null}
    </div>
  );
}
