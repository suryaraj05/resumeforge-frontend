"use client";

import type { ChatSessionSummary } from "@/types/chat";

interface ChatSessionsSidebarProps {
  sessions: ChatSessionSummary[];
  activeId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  className?: string;
}

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function ChatSessionsSidebar({
  sessions,
  activeId,
  onSelect,
  onNewChat,
  onDeleteSession,
  className = "",
}: ChatSessionsSidebarProps) {
  return (
    <aside
      className={`flex flex-col border-border bg-paper ${className}`}
      aria-label="Chat sessions"
    >
      <div className="p-2 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => void onNewChat()}
          className="w-full text-left text-xs font-medium bg-sage text-white rounded-md px-2 py-2 hover:opacity-95 transition-opacity"
        >
          + New chat
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-1 px-1 space-y-0.5">
        {sessions.map((s) => {
          const active = s.id === activeId;
          return (
            <div
              key={s.id}
              className={`group flex items-stretch gap-0.5 rounded-md ${
                active ? "bg-sage/15 ring-1 ring-sage/25" : "hover:bg-border/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="flex-1 min-w-0 text-left px-2 py-2"
              >
                <span className="block text-xs font-medium text-ink truncate" title={s.title}>
                  {s.title || "Chat"}
                </span>
                <span className="block text-[10px] font-mono text-ink-faint mt-0.5">
                  {formatSessionDate(s.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                title="Delete chat"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm("Delete this chat? Messages in this thread will be removed.")) {
                    return;
                  }
                  void onDeleteSession(s.id);
                }}
                className="shrink-0 w-7 flex items-center justify-center text-ink-faint hover:text-red-600/90 opacity-70 group-hover:opacity-100 text-sm leading-none"
              >
                ×
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
