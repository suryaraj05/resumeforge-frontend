"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { useChat } from "@/hooks/useChat";
import { KnowledgeBase } from "@/types/kb";

type RightPanelTab = 'kb' | 'resume' | 'group';

const RIGHT_TABS: { id: RightPanelTab; label: string }[] = [
  { id: "kb", label: "Knowledge Base" },
  { id: "resume", label: "Resume Preview" },
  { id: "group", label: "Group" },
];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const {
    messages,
    isTyping,
    historyLoaded,
    activeSection,
    activeRightTab,
    setActiveRightTab,
    kbVersion,
    resumeSession,
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

  return (
    <div className="h-screen bg-paper flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border px-5 flex items-center justify-between shrink-0 z-10 bg-paper">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold tracking-tight text-ink hover:opacity-80">
            Resume<span className="text-sage">Forge</span>
          </Link>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <span className="text-xs text-ink-muted font-mono hidden sm:block">chat</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: toggle right panel */}
          <button
            onClick={() => setRightPanelOpen((o) => !o)}
            className="md:hidden text-ink-muted hover:text-ink p-1.5"
            aria-label="Toggle panel"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
          <Link href="/activity" className="p-1.5 text-ink-muted hover:text-ink transition-colors hidden sm:block" title="Activity feed">
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

      {/* Main two-panel layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Chat (60%) */}
        <div className={`flex flex-col border-r border-border min-w-0 ${rightPanelOpen ? "w-full md:w-[60%]" : "w-full"} transition-all`}>

          <NotificationsBar
            items={notifications}
            onAccept={(n) => respondToInvite(n, true)}
            onDecline={(n) => respondToInvite(n, false)}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
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

          {/* Input + clear chat */}
          <div className="relative">
            <ChatInput
              ref={chatInputRef}
              onSend={sendMessage}
              disabled={isTyping}
              hasMessages={messages.length > 0}
              loadingHint={loadingHint}
            />
            {messages.length > 0 && (
              <ClearChatButton />
            )}
          </div>
        </div>

        {/* Right — Contextual (40%), hidden on mobile when closed */}
        {rightPanelOpen && (
          <div className="hidden md:flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Tabs */}
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

            {/* Panel content */}
            {activeRightTab === "kb" && (
              <KBSummaryPanel kbVersion={kbVersion} activeSection={activeSection} />
            )}
            {activeRightTab === "resume" && (
              <ResumePanel
                resume={resumeSession.refined}
                ats={resumeSession.ats}
                coverLetter={resumeSession.coverLetter}
                onCoverLetterGenerated={setCoverLetter}
              />
            )}
            {activeRightTab === "group" && (
              <GroupPanel activeGroupId={contextGroupId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClearChatButton() {
  const [clearing, setClearing] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function clear() {
    if (!window.confirm("Clear all chat history?")) return;
    setClearing(true);
    try {
      await import("@/lib/api").then((m) => m.default.delete("/api/chat/history"));
      setDone(true);
      setTimeout(() => window.location.reload(), 500);
    } catch { /* ignore */ }
    finally { setClearing(false); }
  }

  return (
    <button
      type="button"
      onClick={clear}
      disabled={clearing}
      title="Clear chat history"
      className="absolute top-2 right-16 text-[10px] text-ink-faint hover:text-ink-muted transition-colors font-mono"
    >
      {done ? "cleared" : clearing ? "…" : "clear chat"}
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
