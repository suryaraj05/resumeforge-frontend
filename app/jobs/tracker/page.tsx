"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import type { ApplicationDoc, ApplicationStatus } from "@/types/jobs";

function initials(company: string): string {
  const p = company.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function TrackerCompanyMark({ a }: { a: ApplicationDoc }) {
  const [failed, setFailed] = useState(false);
  const url = a.logoUrl?.trim();
  if (url && /^https?:\/\//i.test(url) && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="w-8 h-8 rounded object-contain bg-white border border-border shrink-0 mb-1"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded border border-border bg-sage-light/40 flex items-center justify-center text-[9px] font-semibold text-sage-dark shrink-0 mb-1">
      {initials(a.company)}
    </div>
  );
}

const COLUMNS: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

const LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const [byStatus, setByStatus] = useState<Record<ApplicationStatus, ApplicationDoc[]> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api.get<{ byStatus: Record<ApplicationStatus, ApplicationDoc[]>; all: ApplicationDoc[] }>(
      "/api/applications"
    );
    setByStatus(res.data.byStatus);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user, load]);

  async function onDrop(status: ApplicationStatus, applicationId: string) {
    await api.put(`/api/applications/${applicationId}`, { status });
    await load();
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner className="text-sage" />
      </div>
    );
  }

  const all = byStatus ? Object.values(byStatus).flat() : [];
  const applied = byStatus?.applied.length ?? 0;
  const interviews = byStatus?.interview.length ?? 0;
  const offers = byStatus?.offer.length ?? 0;
  const avgFit =
    all.length > 0
      ? Math.round(all.reduce((s, a) => s + a.fitScore, 0) / all.length)
      : 0;
  const rate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="h-12 border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="text-sm font-semibold">
            ← Jobs
          </Link>
          <span className="text-xs font-mono text-ink-muted">tracker</span>
        </div>
        <Link href="/chat" className="text-xs text-sage">
          Chat
        </Link>
      </header>

      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-4 text-xs text-ink-muted">
        <span>Total {all.length}</span>
        <span>Interview rate {rate}%</span>
        <span>Avg fit {avgFit}%</span>
        <span>Offers {offers}</span>
      </div>

      {loading || !byStatus ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-sage" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto p-4 items-start">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="min-w-[220px] flex-1 border border-border rounded-md bg-paper p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("applicationId");
                if (id) void onDrop(col, id);
              }}
            >
              <h3 className="text-[10px] uppercase tracking-widest text-ink-muted mb-2 px-1">
                {LABELS[col]}
              </h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {byStatus[col].map((a) => (
                  <div
                    key={a.applicationId}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("applicationId", a.applicationId)}
                    className="border border-border rounded p-2 text-xs cursor-grab active:cursor-grabbing hover:bg-sage-light/20 bg-[#FAFAF7]"
                  >
                    <TrackerCompanyMark a={a} />
                    <p className="font-medium">{a.company}</p>
                    <p className="text-ink-muted line-clamp-2">{a.jobTitle}</p>
                    <p className="text-[10px] font-mono mt-1">{a.fitScore}% fit</p>
                    {a.applyUrl ? (
                      <a
                        href={a.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-sage font-medium mt-1 inline-block hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View posting
                      </a>
                    ) : null}
                    <Link
                      href={`/jobs/interview/new?company=${encodeURIComponent(a.company)}&role=${encodeURIComponent(a.jobTitle)}&applicationId=${a.applicationId}`}
                      className="text-[10px] text-sage mt-1 block"
                    >
                      Interview prep
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
