"use client";

import React, { useMemo, useState } from "react";
import type { ChatMessageData } from "@/types/chat";
import api from "@/lib/api";
import { DiffCard } from "./DiffCard";

type Bulk = NonNullable<ChatMessageData["groupBulk"]>;

interface PreviewRow {
  userId: string;
  displayLabel: string;
  section: string;
  patch: unknown;
  currentSection: unknown;
  summary: string;
}

export function GroupBulkMemberFlow({
  bulk,
  onApplied,
}: {
  bulk: Bulk;
  onApplied?: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(bulk.members.map((m) => m.userId))
  );
  const [previews, setPreviews] = useState<PreviewRow[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const allIds = useMemo(() => bulk.members.map((m) => m.userId), [bulk.members]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runPreview() {
    const memberIds = allIds.filter((id) => selected.has(id));
    if (!memberIds.length) return;
    setLoadingPreview(true);
    setApplyError(null);
    try {
      const res = await api.post<{ previews: PreviewRow[] }>("/api/groups/bulk-update", {
        groupId: bulk.groupId,
        memberIds,
        section: bulk.section,
        description: bulk.description,
      });
      setPreviews(res.data.previews ?? []);
    } catch {
      setApplyError("Preview failed. Try again.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function confirmAll() {
    if (!previews?.length) return;
    setApplying(true);
    setApplyError(null);
    try {
      await api.post("/api/groups/bulk-update/apply", {
        groupId: bulk.groupId,
        updates: previews.map((p) => ({
          userId: p.userId,
          section: p.section,
          patch: p.patch,
          summary: p.summary,
        })),
      });
      onApplied?.();
      setPreviews(null);
    } catch {
      setApplyError("Apply failed. Try again.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mt-2 max-w-[95%] space-y-3 text-xs">
      <div className="rounded-md border border-border bg-paper px-3 py-2.5 space-y-2">
        <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wide">
          Bulk KB update — {bulk.groupName}
        </p>
        <p className="text-ink-muted leading-relaxed">{bulk.description}</p>
        <p className="text-[10px] text-ink-faint">Section: {bulk.section}</p>
        {!previews && (
          <>
            <p className="font-medium text-ink pt-1">Members</p>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {bulk.members.map((m) => (
                <li key={m.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`gb-${m.userId}`}
                    checked={selected.has(m.userId)}
                    onChange={() => toggle(m.userId)}
                    className="rounded border-border"
                  />
                  <label htmlFor={`gb-${m.userId}`} className="text-ink cursor-pointer">
                    {m.label}
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={loadingPreview || !selected.size}
              onClick={runPreview}
              className="mt-2 text-xs font-medium bg-sage text-white rounded px-3 py-1.5 disabled:opacity-50"
            >
              {loadingPreview ? "Generating…" : "Preview updates"}
            </button>
          </>
        )}
      </div>

      {applyError ? (
        <p className="text-red-600 text-xs">{applyError}</p>
      ) : null}

      {previews?.map((p) => (
        <div key={p.userId} className="space-y-1">
          <p className="text-[10px] font-semibold text-ink">{p.displayLabel}</p>
          <DiffCard
            section={p.section}
            currentSection={p.currentSection}
            patch={p.patch}
            summary={p.summary}
            status="pending"
            onConfirm={() => {}}
            onCancel={() => {}}
            readOnly
          />
        </div>
      ))}

      {previews?.length ? (
        <div className="flex gap-2 items-center">
          <button
            type="button"
            disabled={applying}
            onClick={confirmAll}
            className="text-xs font-medium bg-sage text-white rounded px-3 py-1.5 disabled:opacity-50"
          >
            {applying ? "Applying…" : "Confirm all"}
          </button>
          <button
            type="button"
            disabled={applying}
            onClick={() => setPreviews(null)}
            className="text-xs text-ink-muted hover:text-ink"
          >
            Back to member list
          </button>
        </div>
      ) : null}
    </div>
  );
}
