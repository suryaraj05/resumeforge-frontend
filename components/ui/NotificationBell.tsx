"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { GroupNotification } from "@/types/groups";
import api from "@/lib/api";

interface NotificationBellProps {
  notifications: GroupNotification[];
  onMarkRead: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell({ notifications, onMarkRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !(n as GroupNotification & { read?: boolean }).read);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (unread.length > 0) {
      try {
        await api.post("/api/profile/notifications/mark-read");
        onMarkRead();
      } catch { /* ignore */ }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={handleOpen}
        className="relative p-1.5 text-ink-muted hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-sage text-white text-[9px] flex items-center justify-center font-bold leading-none">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-full mt-1 w-72 bg-paper border border-border rounded-md shadow-sm z-50",
          "overflow-hidden"
        )}>
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-semibold text-ink uppercase tracking-wide">
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                type="button"
                className="text-[10px] text-ink-muted hover:text-sage"
                onClick={async () => {
                  await api.post("/api/profile/notifications/mark-read");
                  onMarkRead();
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-6">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <NotifRow key={n.id} n={n} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ n }: { n: GroupNotification }) {
  const read = (n as GroupNotification & { read?: boolean }).read;
  return (
    <div className={cn(
      "px-3 py-2.5 border-b border-border/60 last:border-0 text-xs",
      !read && "bg-sage-light/20"
    )}>
      <p className="text-ink leading-relaxed">
        <span className="font-medium">{n.fromDisplayName || "Someone"}</span>
        {" invited you to "}
        <span className="font-medium">{n.groupName}</span>
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[10px] font-mono text-ink-faint">{timeAgo(n.createdAt)}</span>
        <span className={cn(
          "text-[9px] font-mono uppercase px-1.5 py-px rounded",
          n.status === "accepted" && "text-sage bg-sage-light",
          n.status === "declined" && "text-red-500/70 bg-red-50",
          n.status === "pending" && "text-amber-600 bg-amber-50"
        )}>
          {n.status}
        </span>
      </div>
    </div>
  );
}
