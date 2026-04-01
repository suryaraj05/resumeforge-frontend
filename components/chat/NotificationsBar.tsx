"use client";

import React from "react";
import type { GroupNotification } from "@/types/groups";

export function NotificationsBar({
  items,
  onAccept,
  onDecline,
}: {
  items: GroupNotification[];
  onAccept: (n: GroupNotification) => void;
  onDecline: (n: GroupNotification) => void;
}) {
  const pending = items.filter((n) => n.status === "pending" && n.type === "group_invite");
  if (!pending.length) return null;

  return (
    <div className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-2 space-y-2 shrink-0">
      <p className="text-[10px] font-semibold text-amber-900 uppercase tracking-wide">
        Group invites
      </p>
      {pending.map((n) => (
        <div
          key={n.id}
          className="flex flex-wrap items-center gap-2 text-xs text-amber-950"
        >
          <span>
            <span className="font-medium">{n.fromDisplayName || "Someone"}</span>
            {" invited you to "}
            <span className="font-medium">{n.groupName}</span>
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onAccept(n)}
              className="text-[11px] font-medium bg-sage text-white rounded px-2 py-0.5"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onDecline(n)}
              className="text-[11px] text-amber-900/80 underline"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
