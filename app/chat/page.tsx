"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Spinner } from "@/components/ui";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { KBSummaryPanel } from "@/components/kb/KBSummaryPanel";
import { ResumePanel } from "@/components/resume/ResumePanel";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput, ChatInputHandle } from "@/components/chat/ChatInput";
import { NotificationsBar } from "@/components/chat/NotificationsBar";
import { GroupPanel } from "@/components/chat/GroupPanel";
import { InterviewPrepPanel } from "@/components/chat/InterviewPrepPanel";
import { useChat } from "@/hooks/useChat";
import { KnowledgeBase } from "@/types/kb";
import { MyApplicationsPanel } from "@/components/jobs/MyApplicationsPanel";
import { ChatSessionsSidebar } from "@/components/chat/ChatSessionsSidebar";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";
import api from "@/lib/api";
import type { MentionSuggestion } from "@/components/chat/ChatInput";
import type { ApplicationDoc } from "@/types/jobs";

type RightPanelTab = 'kb' | 'resume' | 'group' | 'interview' | 'applications';

const RIGHT_TABS: { id: RightPanelTab; label: string }[] = [
  { id: "kb", label: "Knowledge Base" },
  { id: "resume", label: "Resume Preview" },
  { id: "group", label: "Group" },
  { id: "interview", label: "Interview Prep" },
  { id: "applications", label: "My Applications" },
];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sessionsDrawerOpen, setSessionsDrawerOpen] = useState(false);

  const {
    messages,
    isTyping,
    historyLoaded,
    sessions,
    activeSessionId,
    selectSession,
    startNewChat,
    deleteSession,
    activeSection,
    activeRightTab,
    setActiveRightTab,
    kbVersion,
    resumeSession,
    resumeGenerating,
    resumeAwaitingJd,
    setCoverLetter,
    sendMessage,
    sendContinuation,
    confirmKBUpdate,
    cancelKBUpdate,
    refreshKB,
    contextGroupId,
    notifications,
    inviteToGroup,
    respondToInvite,
    refreshNotifications,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const rightActivityPanelRef = useRef<PanelImperativeHandle>(null);

  const layoutStorage = useMemo(() => {
    if (typeof window !== "undefined") return window.localStorage;
    return {
      getItem: () => null,
      setItem: () => {},
    };
  }, []);

  const { defaultLayout: chatPanelsDefaultLayout, onLayoutChanged: onChatPanelsLayoutChanged } =
    useDefaultLayout({
      id: "rf-chat-layout",
      panelIds: ["sessions", "chat", "activity"],
      storage: layoutStorage,
    });

  const [applicationMentions, setApplicationMentions] = useState<MentionSuggestion[]>([]);
  const [friendMentions, setFriendMentions] = useState<MentionSuggestion[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get<{ all: ApplicationDoc[] }>("/api/applications")
      .then((res) => {
        if (cancelled) return;
        const mentions: MentionSuggestion[] = (res.data.all ?? [])
          .filter((a) => a.status)
          .slice(0, 10)
          .map((a) => {
            const label = `${a.company} — ${a.jobTitle}`;
            return {
              id: `app:${a.applicationId}`,
              label,
              insert: `@${a.company} ${a.jobTitle}`.trim(),
            };
          });
        setApplicationMentions(mentions);
      })
      .catch(() => {
        if (!cancelled) setApplicationMentions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!contextGroupId) {
      setFriendMentions([]);
      return;
    }
    let cancelled = false;
    api
      .get<{ members: { userId: string; displayName: string }[] }>(`/api/groups/${contextGroupId}`)
      .then((res) => {
        if (cancelled) return;
        const members = res.data.members ?? [];
        const mentions: MentionSuggestion[] = members
          .filter((m) => m.userId !== user.uid)
          .slice(0, 8)
          .map((m) => ({
            id: `friend:${m.userId}`,
            label: m.displayName || m.userId,
            insert: `@${m.displayName || m.userId}`,
          }));
        setFriendMentions(mentions);
      })
      .catch(() => {
        if (!cancelled) setFriendMentions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, contextGroupId]);

  const projectMentions = useMemo(() => {
    const refined = resumeSession.refined;
    const projects = refined?.projects ?? [];
    return projects
      .map((p) => p.name?.trim())
      .filter((n): n is string => Boolean(n))
      .slice(0, 8)
      .map((name) => ({
        id: `proj:${name}`,
        label: name,
        insert: `@${name}`,
      })) as MentionSuggestion[];
  }, [resumeSession.refined]);

  const mentionSuggestions = useMemo(() => {
    const base: MentionSuggestion[] = [{ id: "resume", label: "resume", insert: "@resume" }];
    return [...applicationMentions, ...projectMentions, ...friendMentions, ...base].slice(0, 18);
  }, [applicationMentions, projectMentions, friendMentions]);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Keyboard shortcuts: Ctrl+K → focus chat, Esc → close right panel on mobile
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        chatInputRef.current?.focus();
      }
      if (e.key === "Escape" && !rightPanelOpen) {
        setRightPanelOpen(true);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [rightPanelOpen]);

  const handleMarkRead = useCallback(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="lg" className="text-sage" />
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "You";

  // Derive a contextual loading hint from the last user message
  const lastUserMsg = messages.filter((m) => m.role === "user").slice(-1)[0];
  const loadingHint = (() => {
    if (!isTyping) return undefined;
    if (resumeGenerating) {
      return "Generating your tailored resume (often 30–90s) — watch the Resume Preview tab…";
    }
    const txt = lastUserMsg?.content?.toLowerCase() ?? "";
    if (txt.includes("resume") && (txt.includes("generat") || txt.includes("creat"))) return "Curating your resume for this role…";
    if (txt.includes("ats") || txt.includes("applicant tracking")) return "Checking ATS compatibility…";
    if (txt.includes("cover letter")) return "Writing your cover letter…";
    if (txt.includes("interview") || txt.includes("prep")) return "Preparing your interview questions…";
    if (txt.includes("roast") || txt.includes("critique")) return "Reading between the lines…";
    if (txt.includes("upload") || txt.includes("parse")) return "Parsing your resume…";
    if (txt.includes("group") || txt.includes("bulk")) return "Coordinating your group update…";
    return "Thinking about your profile…";
  })();

  function handleUploadSuccess(kb: KnowledgeBase) {
    refreshKB();
    sendMessage(`I uploaded my resume. Here's what was extracted: ${kb.personal?.name ? `Name: ${kb.personal.name}.` : ""} ${(kb.skills?.technical?.length ?? 0) > 0 ? `Skills: ${kb.skills?.technical?.slice(0, 5).join(", ")}.` : ""}`);
  }

  const chatColumn = (
    <>
      <NotificationsBar
        items={notifications}
        onAccept={(n) => respondToInvite(n, true)}
        onDecline={(n) => respondToInvite(n, false)}
      />
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 min-h-0">
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="md" className="text-sage" />
          </div>
        ) : messages.length === 0 ? (
          <WelcomeMessage name={displayName.split(" ")[0]} />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onChipSelect={sendMessage}
              onConfirmKBUpdate={confirmKBUpdate}
              onCancelKBUpdate={cancelKBUpdate}
              onUploadSuccess={handleUploadSuccess}
              onInviteToGroup={inviteToGroup}
              onSendContinuation={sendContinuation}
              onBulkKbApplied={refreshKB}
            />
          ))
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="relative shrink-0 border-t border-border">
        <ChatInput
          ref={chatInputRef}
          onSend={sendMessage}
          disabled={isTyping}
          hasMessages={messages.length > 0}
          loadingHint={loadingHint}
          mentionSuggestions={mentionSuggestions}
        />
        {messages.length > 0 && activeSessionId ? (
          <DeleteThreadButton sessionId={activeSessionId} onDeleted={deleteSession} />
        ) : null}
      </div>
    </>
  );

  const rightActivityPanel = (
    <>
      <div className="h-10 border-b border-border flex items-end px-4 gap-4 shrink-0">
        {RIGHT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRightTab(tab.id)}
            className={`text-xs font-medium pb-2 border-b-[1.5px] transition-colors whitespace-nowrap ${
              activeRightTab === tab.id
                ? "text-sage border-sage"
                : "text-ink-faint border-transparent hover:text-ink-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeRightTab === "kb" && (
        <KBSummaryPanel kbVersion={kbVersion} activeSection={activeSection} />
      )}
      {activeRightTab === "resume" && (
        <ResumePanel
          resume={resumeSession.refined}
          ats={resumeSession.ats}
          coverLetter={resumeSession.coverLetter}
          onCoverLetterGenerated={setCoverLetter}
          generatingResume={resumeGenerating}
          awaitingJobDescription={resumeAwaitingJd}
        />
      )}
      {activeRightTab === "group" && (
        <GroupPanel activeGroupId={contextGroupId} />
      )}
      {activeRightTab === "interview" && (
        <InterviewPrepPanel
          isActive={activeRightTab === "interview"}
          onSwitchToResume={() => setActiveRightTab("resume")}
        />
      )}
      {activeRightTab === "applications" && <MyApplicationsPanel />}
    </>
  );

  const resizeHandleClass =
    "w-1.5 shrink-0 bg-border/90 hover:bg-sage/35 data-[separator=active]:bg-sage/50 transition-colors outline-none cursor-col-resize";

  return (
    <div className="h-screen bg-paper flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border px-5 flex items-center justify-between shrink-0 z-10 bg-paper sticky top-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSessionsDrawerOpen(true)}
            className="md:hidden p-1.5 text-ink-muted hover:text-ink rounded border border-border"
            aria-label="Open chats"
            title="Chats"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <Link href="/" className="text-sm font-semibold tracking-tight text-ink hover:opacity-80">
            Resume<span className="text-sage">Forge</span>
          </Link>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <span className="text-xs text-ink-muted font-mono hidden sm:block">chat</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: toggle right panel */}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                const p = rightActivityPanelRef.current;
                if (p) {
                  if (p.isCollapsed()) {
                    p.expand();
                    setRightPanelOpen(true);
                  } else {
                    p.collapse();
                    setRightPanelOpen(false);
                  }
                }
              } else {
                setRightPanelOpen((o) => !o);
              }
            }}
            className="text-ink-muted hover:text-ink p-1.5"
            aria-label="Toggle activity panel"
            title="Toggle activity panel"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
          <Link href="/jobs" className="text-xs text-ink-muted hover:text-sage hidden sm:block font-medium" title="Jobs">
            Jobs
          </Link>
          <Link href="/activity" className="p-1.5 text-ink-muted hover:text-ink transition-colors" title="Activity feed">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </Link>
          <NotificationBell notifications={notifications} onMarkRead={handleMarkRead} />
          <Link href="/settings" className="p-1.5 text-ink-muted hover:text-ink transition-colors" title="Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar name={displayName} size="sm" />
            <span className="text-xs text-ink-muted hidden sm:block">{displayName}</span>
          </Link>
        </div>
      </header>

      {/* Main layout: sessions | chat | activity (resizable on md+) */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {sessionsDrawerOpen ? (
          <div
            className="md:hidden fixed inset-0 z-30 bg-ink/25"
            role="presentation"
            onClick={() => setSessionsDrawerOpen(false)}
          >
            <div
              className="h-full w-[min(18rem,85vw)] bg-paper border-r border-border shadow-lg flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 py-2 border-b border-border shrink-0">
                <span className="text-xs font-semibold text-ink">Chats</span>
                <button
                  type="button"
                  className="text-xs text-ink-muted px-2 py-1"
                  onClick={() => setSessionsDrawerOpen(false)}
                >
                  Close
                </button>
              </div>
              <ChatSessionsSidebar
                sessions={sessions}
                activeId={activeSessionId}
                onSelect={(id) => {
                  selectSession(id);
                  setSessionsDrawerOpen(false);
                }}
                onNewChat={async () => {
                  await startNewChat();
                  setSessionsDrawerOpen(false);
                }}
                onDeleteSession={deleteSession}
                className="flex-1 min-h-0 border-0 overflow-hidden"
              />
            </div>
          </div>
        ) : null}

        <div className="hidden md:flex flex-1 min-h-0 min-w-0">
          <Group
            orientation="horizontal"
            className="flex flex-1 min-h-0"
            defaultLayout={chatPanelsDefaultLayout}
            onLayoutChanged={onChatPanelsLayoutChanged}
          >
            <Panel
              id="sessions"
              defaultSize="20%"
              minSize="14%"
              maxSize="40%"
              className="min-w-0 min-h-0 flex flex-col"
            >
              <ChatSessionsSidebar
                sessions={sessions}
                activeId={activeSessionId}
                onSelect={selectSession}
                onNewChat={startNewChat}
                onDeleteSession={deleteSession}
                className="h-full min-h-0 border-r border-border"
              />
            </Panel>
            <Separator className={resizeHandleClass} />
            <Panel id="chat" defaultSize="42%" minSize="28%" className="min-w-0 min-h-0 flex flex-col border-r border-border">
              <div className="flex flex-col h-full min-h-0 overflow-hidden">{chatColumn}</div>
            </Panel>
            <Separator className={resizeHandleClass} />
            <Panel
              id="activity"
              panelRef={rightActivityPanelRef}
              collapsible
              collapsedSize="0%"
              defaultSize="38%"
              minSize="18%"
              className="min-w-0 min-h-0 flex flex-col overflow-hidden bg-paper"
            >
              <div className="flex flex-col h-full min-h-0 overflow-hidden">{rightActivityPanel}</div>
            </Panel>
          </Group>
        </div>

        <div className="flex md:hidden flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex flex-col h-full min-h-0 overflow-hidden border-r border-border">
            {chatColumn}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteThreadButton({
  sessionId,
  onDeleted,
}: {
  sessionId: string;
  onDeleted: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);

  async function removeThread() {
    if (!window.confirm("Delete this chat thread?")) return;
    setBusy(true);
    try {
      await onDeleted(sessionId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void removeThread()}
      disabled={busy}
      title="Delete this chat"
      className="absolute top-2 right-16 text-[10px] text-ink-faint hover:text-ink-muted transition-colors font-mono"
    >
      {busy ? "…" : "delete chat"}
    </button>
  );
}

function WelcomeMessage({ name }: { name: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-sage-light border border-sage/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sage text-[10px] font-bold">F</span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink">ResumeForge</span>
          <span className="text-[10px] font-mono text-ink-faint">just now</span>
        </div>
        <div className="px-3 py-2.5 border border-border rounded-md bg-paper text-sm leading-relaxed text-ink max-w-[90%]">
          <p>Hi {name} — I&apos;m your resume AI. Here&apos;s what I can do:</p>
          <ul className="mt-2 space-y-1">
            {[
              "Update your skills, experience, or education",
              "Generate a tailored resume for a specific job",
              "Create a group and invite friends by User ID",
              "Answer questions about your profile",
              "Roast your resume honestly",
              "Prepare interview questions from your background",
            ].map((item) => (
              <li key={item} className="ink-dot text-ink-muted pl-1">{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-ink-muted">What would you like to do?</p>
        </div>
      </div>
    </div>
  );
}
