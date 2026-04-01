"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { KnowledgeBase } from "@/types/kb";
import { Badge, Skeleton, SkeletonLines } from "@/components/ui";
import { KBPreview } from "./KBPreview";
import { ActiveSection } from "@/hooks/useChat";

interface HistoryEntry extends KnowledgeBase {
  changeSummary?: string;
}

type PanelView = "summary" | "full";

interface KBSummaryPanelProps {
  kbVersion: number;       // Increment to trigger re-fetch
  activeSection?: ActiveSection;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function KBSummaryPanel({ kbVersion, activeSection }: KBSummaryPanelProps) {
  const [kb, setKB] = useState<KnowledgeBase | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PanelView>("summary");

  const fetchKB = useCallback(async () => {
    try {
      const [kbRes, histRes] = await Promise.allSettled([
        api.get<KnowledgeBase>("/api/profile/kb"),
        api.get<{ history: HistoryEntry[] }>("/api/profile/kb/history"),
      ]);
      if (kbRes.status === "fulfilled") setKB(kbRes.value.data);
      if (histRes.status === "fulfilled") setHistory(histRes.value.data.history.slice(0, 5));
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchKB();
  }, [kbVersion, fetchKB]);

  const topTechnical = kb?.skills?.technical?.slice(0, 6) ?? [];
  const topTools = kb?.skills?.tools?.slice(0, 4) ?? [];
  const allTopSkills = [...topTechnical, ...topTools].slice(0, 8);

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="border border-border rounded px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded px-2 py-2 space-y-1">
              <Skeleton className="h-5 w-8 mx-auto" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-5 w-14 rounded-full" />
            ))}
          </div>
        </div>
        <SkeletonLines lines={3} />
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Knowledge Base</h3>
          <p className="text-xs text-ink-muted">Your structured career summary lives here.</p>
        </div>
        <div className="border border-dashed border-border rounded p-6 text-center space-y-2">
          <p className="text-xs text-ink-faint">No knowledge base yet.</p>
          <p className="text-xs text-ink-faint">Upload your resume or tell me about your background.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Knowledge Base</h3>
          {kb.version && (
            <p className="text-[10px] font-mono text-ink-faint mt-0.5">
              v{kb.version} · {timeAgo(kb.lastUpdated)}
            </p>
          )}
        </div>
        <button
          onClick={() => setView((v) => (v === "summary" ? "full" : "summary"))}
          className="text-[10px] font-medium text-sage hover:text-sage-dark transition-colors border border-sage/20 rounded px-2 py-1 hover:bg-sage-light"
        >
          {view === "summary" ? "Full view" : "Summary"}
        </button>
      </div>

      {view === "summary" ? (
        <div className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto">
          {/* Identity */}
          {kb.personal?.name && (
            <div className="border border-border rounded px-4 py-3 space-y-0.5">
              <p className="text-sm font-semibold text-ink">{kb.personal.name}</p>
              {kb.personal.email && <p className="text-xs text-ink-muted">{kb.personal.email}</p>}
              {kb.personal.location && <p className="text-xs text-ink-faint">{kb.personal.location}</p>}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Experience", value: kb.experience?.length ?? 0 },
              { label: "Projects", value: kb.projects?.length ?? 0 },
              { label: "Education", value: kb.education?.length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="border border-border rounded px-2 py-2.5 text-center">
                <p className="text-base font-semibold text-ink">{value}</p>
                <p className="text-[10px] text-ink-faint">{label}</p>
              </div>
            ))}
          </div>

          {/* Active section highlight */}
          {activeSection && (
            <div className="border border-sage/30 bg-sage-light/40 rounded px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-sage">Discussing:</span>
              <span className="text-xs font-semibold text-sage-dark capitalize">{activeSection}</span>
            </div>
          )}

          {/* Top skills */}
          {allTopSkills.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Top Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {allTopSkills.map((s) => <Badge key={s} variant="sage">{s}</Badge>)}
                {((kb.skills?.technical?.length ?? 0) + (kb.skills?.tools?.length ?? 0)) > 8 && (
                  <Badge variant="muted">
                    +{(kb.skills?.technical?.length ?? 0) + (kb.skills?.tools?.length ?? 0) - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Summary snippet */}
          {kb.personal?.summary && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Summary</p>
              <p className="text-xs text-ink-muted leading-relaxed line-clamp-4">{kb.personal.summary}</p>
            </div>
          )}

          {/* Recent experience */}
          {(kb.experience?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Recent Experience</p>
              {kb.experience?.slice(0, 2).map((exp) => (
                <div key={exp.id} className="border border-border rounded px-3 py-2.5 space-y-0.5">
                  <p className="text-xs font-semibold text-ink">{exp.role}</p>
                  <p className="text-xs text-ink-muted">{exp.company}</p>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-[10px] font-mono text-ink-faint">
                      {[exp.startDate, exp.endDate].filter(Boolean).join(" → ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent changes changelog */}
          {history.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Recent Changes</p>
              <div className="space-y-1">
                {history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px]">
                    <span className="text-sage mt-0.5 shrink-0">·</span>
                    <span className="text-ink-muted flex-1 leading-relaxed">
                      {entry.changeSummary ?? `Updated · v${entry.version}`}
                    </span>
                    <span className="font-mono text-ink-faint shrink-0">{timeAgo(entry.lastUpdated)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          <KBPreview kb={kb} activeSection={activeSection ?? undefined} />
        </div>
      )}
    </div>
  );
}
