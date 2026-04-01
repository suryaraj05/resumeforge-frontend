"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChatMessage,
  ChatMessageData,
  ClientChatContinuation,
  StoredChatMessage,
} from "@/types/chat";
import type { GroupNotification } from "@/types/groups";
import { RefinedResume, ATSScoreResult } from "@/types/resume";
import api from "@/lib/api";

function newId() {
  return typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function chatRequestErrorMessage(err: unknown): string {
  const ax = err as { response?: { status?: number; data?: { error?: string } }; message?: string };
  const msg = ax.response?.data?.error;
  if (typeof msg === "string" && msg.trim()) return msg;
  const st = ax.response?.status;
  if (st === 429)
    return "Too many AI requests right now (hourly limit). Wait a bit and try again, or check your Gemini quota.";
  if (st === 401) return "Your session expired. Please sign in again.";
  if (st === 503) return "Chat is temporarily unavailable (server configuration).";
  if (st === 500) return "The server hit an error. If it keeps happening, check API logs and Gemini API status.";
  return "Something went wrong. Please try again.";
}

function toStored(msg: ChatMessage): StoredChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    intent: msg.intent,
    timestamp: msg.timestamp.toISOString(),
  };
}

function fromStored(msg: StoredChatMessage): ChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    intent: msg.intent,
    timestamp: new Date(msg.timestamp),
  };
}

export type ActiveSection =
  | 'personal' | 'education' | 'experience' | 'projects'
  | 'skills' | 'certifications' | 'achievements' | null;

export type ActiveRightTab = 'kb' | 'resume' | 'group' | 'interview';

export interface ResumeSessionState {
  refined: RefinedResume | null;
  ats: ATSScoreResult | null;
  coverLetter: string | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  historyLoaded: boolean;
  activeSection: ActiveSection;
  activeRightTab: ActiveRightTab;
  setActiveRightTab: (tab: ActiveRightTab) => void;
  kbVersion: number;
  resumeSession: ResumeSessionState;
  /** True while a long JD message is being processed (resume generation path). */
  resumeGenerating: boolean;
  /** Server asked for a full job description before generation can run. */
  resumeAwaitingJd: boolean;
  setCoverLetter: (text: string) => void;
  sendMessage: (text: string) => Promise<void>;
  sendContinuation: (continuation: ClientChatContinuation, displayMessage: string) => Promise<void>;
  confirmKBUpdate: (messageId: string, section: string, patch: unknown, summary?: string) => Promise<void>;
  cancelKBUpdate: (messageId: string) => void;
  refreshKB: () => void;
  contextGroupId: string | null;
  notifications: GroupNotification[];
  inviteToGroup: (groupId: string, targetUserId: string) => Promise<void>;
  respondToInvite: (n: GroupNotification, accept: boolean) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const SECTION_TO_INTENT_MAP: Record<string, ActiveSection> = {
  personal: 'personal',
  education: 'education',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
  certifications: 'certifications',
  achievements: 'achievements',
};

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [activeRightTab, setActiveRightTab] = useState<ActiveRightTab>('kb');
  const [kbVersion, setKbVersion] = useState(0);
  const [resumeSession, setResumeSession] = useState<ResumeSessionState>({
    refined: null,
    ats: null,
    coverLetter: null,
  });
  const [contextGroupId, setContextGroupId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<GroupNotification[]>([]);
  const [resumeGenerating, setResumeGenerating] = useState(false);
  const [resumeAwaitingJd, setResumeAwaitingJd] = useState(false);
  const resumeAwaitingJdRef = useRef(false);
  resumeAwaitingJdRef.current = resumeAwaitingJd;

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    api
      .get<{ latestResume?: RefinedResume; lastAts?: ATSScoreResult; lastCoverLetter?: string }>(
        "/api/resume/session"
      )
      .then((res) => {
        const d = res.data;
        if (d.latestResume) {
          setResumeSession({
            refined: d.latestResume,
            ats: d.lastAts ?? null,
            coverLetter: d.lastCoverLetter ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get<{ history: StoredChatMessage[] }>("/api/chat/history")
      .then((res) => {
        setMessages(res.data.history.map(fromStored));
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: GroupNotification[] }>(
        "/api/profile/notifications"
      );
      setNotifications(res.data.notifications ?? []);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const refreshKB = useCallback(() => {
    setKbVersion((v) => v + 1);
  }, []);

  const setCoverLetter = useCallback((text: string) => {
    setResumeSession((prev) => ({ ...prev, coverLetter: text }));
  }, []);

  const updateMessageData = useCallback((messageId: string, update: Partial<ChatMessageData>) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, data: { ...m.data, ...update } }
          : m
      )
    );
  }, []);

  const applyBotResponse = useCallback(
    (intent: string, reply: string, data?: ChatMessageData) => {
      if (intent === 'update_kb' && data?.section) {
        setActiveSection(SECTION_TO_INTENT_MAP[data.section] ?? null);
      } else if (
        intent === 'generate_resume' ||
        intent === 'ats_check' ||
        intent === 'cover_letter' ||
        (data?.refinedResume != null && intent === 'chitchat')
      ) {
        setActiveRightTab('resume');
        setActiveSection(null);
      } else if (
        intent === 'group_create' ||
        intent === 'group_add_member' ||
        intent === 'group_update' ||
        intent === 'peer_compare'
      ) {
        setActiveRightTab('group');
        setActiveSection(null);
      } else if (intent === 'interview_prep') {
        setActiveRightTab('interview');
        setActiveSection(null);
      } else if (intent !== 'ask_kb') {
        setActiveSection(null);
      }

      if (data?.groupBulk?.groupId) {
        setContextGroupId(data.groupBulk.groupId);
      } else if (data?.groupId) {
        setContextGroupId(data.groupId);
      }

      if (intent === 'generate_resume') {
        if (data?.awaitingJobDescription && !data?.refinedResume) {
          setResumeAwaitingJd(true);
        } else if (!data?.refinedResume) {
          setResumeAwaitingJd(false);
        }
      }

      if (data?.refinedResume) {
        setResumeAwaitingJd(false);
        if (intent === 'generate_resume') {
          setResumeSession({
            refined: data.refinedResume,
            ats: data.atsScore ?? null,
            coverLetter: null,
          });
        } else if (intent === 'cover_letter' && data.coverLetterText != null) {
          setResumeSession((prev) => ({
            refined: data.refinedResume!,
            coverLetter: data.coverLetterText!,
            ats: data.atsScore ?? prev.ats,
          }));
        } else {
          setResumeSession((prev) => ({
            refined: data.refinedResume!,
            ats: data.atsScore != null ? data.atsScore! : prev.ats,
            coverLetter: prev.coverLetter,
          }));
        }
      } else if (intent === 'ats_check' && data?.atsScore) {
        setResumeSession((prev) => ({
          ...prev,
          ats: data.atsScore!,
          refined: data.refinedResume ?? prev.refined,
        }));
      } else if (intent === 'cover_letter' && data?.coverLetterText) {
        setResumeSession((prev) => ({
          ...prev,
          coverLetter: data.coverLetterText!,
          refined: data.refinedResume ?? prev.refined,
          ats: data.atsScore ?? prev.ats,
        }));
      }

      const botMsg: ChatMessage = {
        id: newId(),
        role: 'bot',
        content: reply,
        intent: intent as ChatMessage['intent'],
        timestamp: new Date(),
        data:
          intent === 'update_kb'
            ? { ...data, diffStatus: 'pending' as const }
            : data,
      };

      setMessages((prev) => [...prev, botMsg]);
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      const t = text.trim();
      const longEnoughForResume =
        resumeAwaitingJdRef.current ? t.length >= 80 : t.length >= 100;
      if (longEnoughForResume) {
        setResumeGenerating(true);
        setActiveRightTab("resume");
      }

      const history = messagesRef.current.slice(-10).map(toStored);

      try {
        const res = await api.post<{
          intent: string;
          reply: string;
          data?: ChatMessageData;
        }>("/api/chat/message", {
          message: text,
          history,
        });

        const { intent, reply, data } = res.data;
        applyBotResponse(intent, reply, data);
      } catch (err) {
        const errMsg: ChatMessage = {
          id: newId(),
          role: 'bot',
          content: chatRequestErrorMessage(err),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
        setResumeGenerating(false);
      }
    },
    [applyBotResponse]
  );

  const sendContinuation = useCallback(
    async (continuation: ClientChatContinuation, displayMessage: string) => {
      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content: displayMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      const t = displayMessage.trim();
      const longEnoughForResume =
        resumeAwaitingJdRef.current ? t.length >= 80 : t.length >= 100;
      if (longEnoughForResume) {
        setResumeGenerating(true);
        setActiveRightTab("resume");
      }
      const history = messagesRef.current.slice(-10).map(toStored);
      try {
        const res = await api.post<{
          intent: string;
          reply: string;
          data?: ChatMessageData;
        }>("/api/chat/message", {
          message: displayMessage,
          history,
          continuation,
        });
        const { intent, reply, data } = res.data;
        applyBotResponse(intent, reply, data);
      } catch (err) {
        const errMsg: ChatMessage = {
          id: newId(),
          role: 'bot',
          content: chatRequestErrorMessage(err),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
        setResumeGenerating(false);
      }
    },
    [applyBotResponse]
  );

  const inviteToGroup = useCallback(async (groupId: string, targetUserId: string) => {
    try {
      await api.post(`/api/groups/${groupId}/invite`, { targetUserId });
      const botMsg: ChatMessage = {
        id: newId(),
        role: 'bot',
        content: "Invite sent. They'll see a notification when they open ResumeForge.",
        timestamp: new Date(),
        intent: 'group_add_member',
        data: { groupId, suggestions: ['Tell my group we won a hackathon'] },
      };
      setMessages((prev) => [...prev, botMsg]);
      setContextGroupId(groupId);
      setActiveRightTab('group');
    } catch {
      const errMsg: ChatMessage = {
        id: newId(),
        role: 'bot',
        content: "Could not send invite. Check the user ID and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }, []);

  const respondToInvite = useCallback(
    async (n: GroupNotification, accept: boolean) => {
      try {
        await api.post(`/api/groups/${n.groupId}/invite/respond`, {
          notificationId: n.id,
          accept,
        });
        await refreshNotifications();
        const botMsg: ChatMessage = {
          id: newId(),
          role: 'bot',
          content: accept
            ? `You joined "${n.groupName}". Open the Group tab to see members.`
            : `You declined the invite to "${n.groupName}".`,
          timestamp: new Date(),
          data: accept ? { groupId: n.groupId } : undefined,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (accept) {
          setContextGroupId(n.groupId);
          setActiveRightTab('group');
        }
      } catch {
        const errMsg: ChatMessage = {
          id: newId(),
          role: 'bot',
          content: "Could not update the invite. Try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    },
    [refreshNotifications]
  );

  const confirmKBUpdate = useCallback(
    async (messageId: string, section: string, patch: unknown, summary?: string) => {
      updateMessageData(messageId, { diffStatus: 'pending' });

      try {
        await api.post("/api/profile/kb/update", { section, patch, summary });

        updateMessageData(messageId, { diffStatus: 'confirmed' });
        refreshKB();

        const confirmMsg: ChatMessage = {
          id: newId(),
          role: 'bot',
          content: `✓ Updated your ${section}. Your knowledge base is now up to date.`,
          timestamp: new Date(),
          data: {
            suggestions: ['Add another detail', 'Show my full profile', 'Generate a tailored resume'],
          },
        };
        setMessages((prev) => [...prev, confirmMsg]);
      } catch {
        updateMessageData(messageId, { diffStatus: 'error' });
      }
    },
    [updateMessageData, refreshKB]
  );

  const cancelKBUpdate = useCallback(
    (messageId: string) => {
      updateMessageData(messageId, { diffStatus: 'cancelled' });
    },
    [updateMessageData]
  );

  return {
    messages,
    isTyping,
    historyLoaded,
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
  };
}
