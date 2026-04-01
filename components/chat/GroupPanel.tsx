"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Avatar, Spinner } from "@/components/ui";

interface GroupSummary {
  groupId: string;
  name: string;
  createdBy: string;
  members: { userId: string; role: string; joinedAt: string }[];
  createdAt: string;
}

interface MemberRow {
  userId: string;
  displayName: string;
  role: string;
  kbLastUpdated?: string;
}

export function GroupPanel({ activeGroupId }: { activeGroupId: string | null }) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detail, setDetail] = useState<{
    group: GroupSummary;
    members: MemberRow[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [localGroupId, setLocalGroupId] = useState<string | null>(null);

  const selectedId =
    localGroupId ?? activeGroupId ?? groups[0]?.groupId ?? null;

  useEffect(() => {
    setLocalGroupId(null);
  }, [activeGroupId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    api
      .get<{ groups: GroupSummary[] }>("/api/groups")
      .then((res) => {
        if (!cancelled) setGroups(res.data.groups ?? []);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    api
      .get<{ group: GroupSummary; members: MemberRow[] }>(`/api/groups/${selectedId}`)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (loadingList) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Spinner size="md" className="text-sage" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="flex-1 p-6 space-y-2">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Group</h3>
        <p className="text-xs text-ink-muted leading-relaxed">
          You are not in any group yet. Say <span className="font-mono text-ink">create a group</span> in chat
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <label className="text-[10px] font-mono text-ink-faint uppercase tracking-wide block mb-1">
          Active group
        </label>
        <select
          className="w-full text-xs border border-border rounded px-2 py-1.5 bg-paper text-ink"
          value={selectedId ?? ""}
          onChange={(e) => {
            const id = e.target.value;
            setLocalGroupId(id || null);
          }}
        >
          {groups.map((g) => (
            <option key={g.groupId} value={g.groupId}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" className="text-sage" />
          </div>
        ) : detail ? (
          <>
            <div>
              <h3 className="text-sm font-semibold text-ink">{detail.group.name}</h3>
              <p className="text-[10px] font-mono text-ink-faint mt-0.5 break-all">
                ID: {detail.group.groupId}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Members &amp; KB status
              </p>
              <ul className="space-y-2">
                {detail.members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 border border-border rounded px-2 py-1.5"
                  >
                    <Avatar name={m.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{m.displayName}</p>
                      <p className="text-[10px] text-ink-faint">
                        {m.role}
                        {m.kbLastUpdated
                          ? ` · KB updated ${new Date(m.kbLastUpdated).toLocaleDateString()}`
                          : " · No KB timestamp"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-muted">Could not load group.</p>
        )}
      </div>
    </div>
  );
}
