"use client";

import Link from "next/link";

export interface JobCardLite {
  jobId: string;
  title: string;
  company: string;
  fitScore: number;
  location: string;
  whyThisRole: string;
}

export function JobSearchCards({ cards }: { cards: JobCardLite[] }) {
  if (!cards.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {cards.map((c) => (
        <Link
          key={c.jobId}
          href={`/jobs?jobId=${encodeURIComponent(c.jobId)}`}
          className="block border border-border rounded-md p-3 bg-paper hover:bg-sage-light/30 transition-colors"
        >
          <div className="flex justify-between gap-2 items-start">
            <div>
              <p className="text-sm font-medium text-ink">{c.title}</p>
              <p className="text-xs text-ink-muted">{c.company} · {c.location}</p>
            </div>
            <span
              className={`text-xs font-mono shrink-0 px-2 py-0.5 rounded ${
                c.fitScore >= 70
                  ? "bg-sage/15 text-sage-dark"
                  : c.fitScore >= 40
                    ? "bg-amber-50 text-amber-800"
                    : "bg-border/60 text-ink-muted"
              }`}
            >
              {c.fitScore}%
            </span>
          </div>
          {c.whyThisRole ? (
            <p className="text-xs text-ink-muted mt-2 italic leading-relaxed">{c.whyThisRole}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
