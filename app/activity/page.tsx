"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import { SkeletonLines } from "@/components/ui/Skeleton";
import api from "@/lib/api";

interface FeedEntry {
  timestamp: string;
  summary: string;
  version: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function entryIcon(summary: string): string {
  const s = summary.toLowerCase();
  if (s.includes("upload") || s.includes("resume")) return "↑";
  if (s.includes("skill")) return "⚙";
  if (s.includes("project")) return "+";
  if (s.includes("experience") || s.includes("work")) return "◈";
  if (s.includes("rollback") || s.includes("revert")) return "↩";
  if (s.includes("education")) return "🎓";
  if (s.includes("achievement") || s.includes("award") || s.includes("hackathon")) return "★";
  return "~";
}

export default function ActivityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ feed: FeedEntry[] }>("/api/profile/activity")
      .then((res) => setFeed(res.data.feed ?? []))
      .catch(() => setFeed([]))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="lg" className="text-sage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper bg-grid-paper">
      <header className="border-b border-border px-5 py-4 flex items-center justify-between bg-paper">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-ink-muted hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-ink">Activity Feed</span>
        </div>
        <Link href="/chat" className="text-xs text-sage hover:underline">Back to chat</Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        <div className="space-y-1 mb-6">
          <h1 className="text-lg font-semibold text-ink">Your KB Changes</h1>
          <p className="text-xs text-ink-muted">
            A chronological log of every update to your knowledge base.
          </p>
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-border rounded-md px-4 py-3">
                <SkeletonLines lines={2} />
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="border border-dashed border-border rounded-md p-10 text-center">
            <p className="text-sm text-ink-muted">No activity yet.</p>
            <p className="text-xs text-ink-faint mt-1">
              Updates to your knowledge base will appear here.
            </p>
          </div>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-5">
            {feed.map((entry, i) => (
              <li key={i} className="relative pl-6">
                {/* Dot */}
                <span className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-paper border-2 border-sage/40 flex items-center justify-center text-[9px] text-sage font-bold">
                  {entryIcon(entry.summary)}
                </span>
                <div className="border border-border rounded-md px-3 py-2.5 bg-paper hover:border-sage/30 transition-colors">
                  <p className="text-sm text-ink leading-relaxed">{entry.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-ink-faint">{timeAgo(entry.timestamp)}</span>
                    <span className="text-[10px] text-ink-faint/60">·</span>
                    <span className="text-[10px] font-mono text-ink-faint">v{entry.version}</span>
                    <span className="text-[10px] text-ink-faint/60">·</span>
                    <span className="text-[10px] font-mono text-ink-faint">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
