"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DiffCardProps {
  section: string;
  currentSection: unknown;
  patch: unknown;
  summary: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'error';
  onConfirm: () => void;
  onCancel: () => void;
  /** Hide actions (e.g. bulk preview where one button applies all). */
  readOnly?: boolean;
}

// ─── Diff computation ─────────────────────────────────────────────────────────

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';
interface DiffRow {
  label: string;
  type: DiffType;
  oldVal?: string;
  newVal?: string;
}

function stringify(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function getName(item: unknown): string {
  if (typeof item !== 'object' || item === null) return String(item);
  const obj = item as Record<string, unknown>;
  return (obj.name ?? obj.role ?? obj.title ?? obj.degree ?? obj.company ?? obj.institution ?? obj.id ?? '?') as string;
}

function computeDiff(current: unknown, patch: unknown): DiffRow[] {
  const rows: DiffRow[] = [];

  // Array diff (experience, education, projects, etc.)
  if (Array.isArray(patch) || Array.isArray(current)) {
    const oldArr = Array.isArray(current) ? (current as Record<string, unknown>[]) : [];
    const newArr = Array.isArray(patch) ? (patch as Record<string, unknown>[]) : [];
    const oldIds = new Map(oldArr.map((i) => [i.id as string, i]));
    const newIds = new Map(newArr.map((i) => [i.id as string, i]));

    oldArr.forEach((item) => {
      if (!newIds.has(item.id as string)) {
        rows.push({ label: getName(item), type: 'removed', oldVal: getName(item) });
      }
    });

    newArr.forEach((item) => {
      if (!oldIds.has(item.id as string)) {
        rows.push({ label: getName(item), type: 'added', newVal: getName(item) });
      } else {
        const old = oldIds.get(item.id as string)!;
        const changed = JSON.stringify(old) !== JSON.stringify(item);
        rows.push({
          label: getName(item),
          type: changed ? 'changed' : 'unchanged',
          oldVal: changed ? stringify(old) : undefined,
          newVal: changed ? stringify(item) : undefined,
        });
      }
    });

    return rows;
  }

  // Object diff (personal, skills)
  if (typeof patch === 'object' && patch !== null) {
    const oldObj = (typeof current === 'object' && current !== null ? current : {}) as Record<string, unknown>;
    const newObj = patch as Record<string, unknown>;

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    allKeys.forEach((key) => {
      const oldVal = stringify(oldObj[key]);
      const newVal = stringify(newObj[key]);

      if (!(key in oldObj) && key in newObj) {
        rows.push({ label: key, type: 'added', newVal });
      } else if (key in oldObj && !(key in newObj)) {
        rows.push({ label: key, type: 'removed', oldVal });
      } else if (oldVal !== newVal) {
        rows.push({ label: key, type: 'changed', oldVal, newVal });
      } else {
        rows.push({ label: key, type: 'unchanged', oldVal });
      }
    });

    return rows;
  }

  return [];
}

// ─── DiffCard component ───────────────────────────────────────────────────────

export function DiffCard({
  section,
  currentSection,
  patch,
  summary,
  status,
  onConfirm,
  onCancel,
  readOnly,
}: DiffCardProps) {
  const [expanded, setExpanded] = useState(true);
  const diffRows = computeDiff(currentSection, patch);
  const changes = diffRows.filter((r) => r.type !== 'unchanged');

  const isResolved = status === 'confirmed' || status === 'cancelled';

  return (
    <div className={cn(
      "mt-2 border rounded-md overflow-hidden text-xs",
      status === 'confirmed' ? 'border-green-200 opacity-75' :
      status === 'cancelled' ? 'border-border opacity-50' :
      status === 'error' ? 'border-danger/40' :
      'border-border'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5 bg-sage-light/30 border-b border-border">
        <div className="space-y-0.5">
          <p className="text-[10px] font-mono text-sage uppercase tracking-wide">
            {status === 'confirmed' ? '✓ Applied' :
             status === 'cancelled' ? 'Cancelled' :
             status === 'error' ? '✕ Failed' :
             readOnly ? `Preview · ${section}` :
             `Proposed change · ${section}`}
          </p>
          <p className="text-ink font-medium">{summary}</p>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-ink-faint hover:text-ink shrink-0 text-base leading-none"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Comparison table + row cards for long values */}
      {expanded && (
        <div className="bg-paper border-t border-border">
          <p className="text-[10px] text-ink-muted px-3 py-2 leading-relaxed border-b border-border/60">
            Merged by id where possible: rows you don&apos;t change stay in your KB. Confirm applies the patch below.
          </p>
          {changes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-border text-ink-faint font-mono uppercase bg-paper">
                      <th className="px-2 py-1.5 font-medium w-[18%]">Field</th>
                      <th className="px-2 py-1.5 font-medium w-[12%]">Change</th>
                      <th className="px-2 py-1.5 font-medium w-[35%]">Before</th>
                      <th className="px-2 py-1.5 font-medium w-[35%]">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((row, i) => (
                      <tr key={i} className="border-b border-border/70 align-top">
                        <td className="px-2 py-1.5 font-medium text-ink">{row.label}</td>
                        <td className="px-2 py-1.5 font-mono text-ink-muted capitalize">{row.type}</td>
                        <td className="px-2 py-1.5 text-red-700/85 break-words max-w-[180px]">
                          {row.oldVal ?? "—"}
                        </td>
                        <td className="px-2 py-1.5 text-sage-dark break-words max-w-[180px]">
                          {row.newVal ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-ink-faint text-center py-3 text-[10px]">No visible changes in diff view.</p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isResolved && !readOnly && (
        <div className="flex gap-2 px-3 py-2.5 border-t border-border bg-paper">
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            className="flex-1"
          >
            Confirm update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
