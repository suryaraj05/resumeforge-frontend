"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui";
import api from "@/lib/api";
import { InterviewQuestion } from "@/types/chat";
import { InterviewPrepCard, interviewQuestionTitle } from "./InterviewPrepCard";

const MIN_JD_LEN = 80;

type ApiPrepRow = {
  type?: string;
  question?: string;
  q?: string;
  hint?: string;
  answer?: string;
};

function normalizeApiQuestions(raw: ApiPrepRow[] | undefined): InterviewQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === "object")
    .map((r) => {
      const answer = typeof r.answer === "string" ? r.answer.trim() : "";
      return {
        type: typeof r.type === "string" ? r.type : undefined,
        question: typeof r.question === "string" ? r.question : undefined,
        q: typeof r.q === "string" ? r.q : undefined,
        hint: typeof r.hint === "string" ? r.hint : "",
        answer: answer.length > 0 ? answer : undefined,
      };
    })
    .filter(
      (r) =>
        interviewQuestionTitle(r).length > 0 ||
        r.hint.length > 0 ||
        Boolean(r.answer?.length)
    );
}

function formatSavedAt(iso: string | undefined): string | null {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type SavedPrepDoc = {
  questions?: ApiPrepRow[];
  updatedAt?: string;
} | null;

interface InterviewPrepPanelProps {
  /** Refetch session JD when user switches to this tab */
  isActive: boolean;
  onSwitchToResume: () => void;
}

export function InterviewPrepPanel({ isActive, onSwitchToResume }: InterviewPrepPanelProps) {
  const toast = useToast();
  const [sessionJd, setSessionJd] = useState<string | null>(null);
  const [roleQuestions, setRoleQuestions] = useState<InterviewQuestion[] | null>(null);
  const [generalQuestions, setGeneralQuestions] = useState<InterviewQuestion[] | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [jdStale, setJdStale] = useState(false);
  const [roleSavedAt, setRoleSavedAt] = useState<string | null>(null);
  const [generalSavedAt, setGeneralSavedAt] = useState<string | null>(null);

  const loadSavedPrep = useCallback(async () => {
    try {
      const res = await api.get<{
        general: SavedPrepDoc;
        role: SavedPrepDoc;
        jdStale?: boolean;
      }>("/api/chat/interview-prep");
      setJdStale(Boolean(res.data?.jdStale));
      const g = res.data?.general;
      const r = res.data?.role;
      if (g === null || g === undefined) {
        setGeneralQuestions(null);
        setGeneralSavedAt(null);
      } else {
        setGeneralSavedAt(formatSavedAt(g.updatedAt) ?? null);
        setGeneralQuestions(g.questions?.length ? normalizeApiQuestions(g.questions) : null);
      }
      if (r === null || r === undefined) {
        setRoleQuestions(null);
        setRoleSavedAt(null);
      } else {
        setRoleSavedAt(formatSavedAt(r.updatedAt) ?? null);
        setRoleQuestions(r.questions?.length ? normalizeApiQuestions(r.questions) : null);
      }
    } catch {
      /* keep local state */
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const res = await api.get<{ jd?: string }>("/api/resume/session");
      const jd = res.data?.jd?.trim() ?? "";
      setSessionJd(jd.length ? jd : null);
    } catch {
      setSessionJd(null);
    }
  }, []);

  useEffect(() => {
    loadSession();
    loadSavedPrep();
  }, [loadSession, loadSavedPrep]);

  useEffect(() => {
    if (isActive) {
      loadSession();
      loadSavedPrep();
    }
  }, [isActive, loadSession, loadSavedPrep]);

  const hasRoleJd = (sessionJd?.length ?? 0) >= MIN_JD_LEN;

  async function generateRole() {
    if (!hasRoleJd || !sessionJd || roleLoading) return;
    setRoleLoading(true);
    setRoleError(null);
    toast("Generating role-specific questions — usually under a minute.", "info");
    try {
      const res = await api.post<{ questions: ApiPrepRow[] }>(
        "/api/chat/interview-prep",
        { mode: "role", jd: sessionJd }
      );
      const list = normalizeApiQuestions(res.data?.questions);
      if (!list.length) {
        setRoleError("No questions returned. Try again.");
        return;
      }
      setRoleQuestions(list);
      await loadSavedPrep();
      toast(`Generated ${list.length} role-specific questions.`, "success");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string }; status?: number } };
      const msg = ax.response?.data?.error;
      setRoleError(typeof msg === "string" ? msg : "Request failed. Try again.");
      toast(typeof msg === "string" ? msg : "Could not generate questions.", "error");
    } finally {
      setRoleLoading(false);
    }
  }

  async function generateGeneral() {
    if (generalLoading) return;
    setGeneralLoading(true);
    setGeneralError(null);
    toast("Generating general interview questions — usually under a minute.", "info");
    try {
      const res = await api.post<{ questions: ApiPrepRow[] }>(
        "/api/chat/interview-prep",
        { mode: "general" }
      );
      const list = normalizeApiQuestions(res.data?.questions);
      if (!list.length) {
        setGeneralError("No questions returned. Try again.");
        return;
      }
      setGeneralQuestions(list);
      await loadSavedPrep();
      toast(`Generated ${list.length} general questions.`, "success");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      const msg = ax.response?.data?.error;
      setGeneralError(typeof msg === "string" ? msg : "Request failed. Try again.");
      toast(typeof msg === "string" ? msg : "Could not generate questions.", "error");
    } finally {
      setGeneralLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-4 min-h-0">
      <div>
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Interview Prep</h3>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Two questionnaires from your knowledge base: one aligned to a job description in your session, and one for any interview.
        </p>
        <p className="text-xs mt-2">
          <Link href="/interview/coach" className="text-sage font-medium hover:underline" target="_blank" rel="noopener noreferrer">
            Open Voice Coach (new tab)
          </Link>
          <span className="text-ink-muted"> — practice with speech in the browser.</span>
        </p>
      </div>

      <section className="space-y-2">
        <h4 className="text-[11px] font-semibold text-ink">For this role (JD + your profile)</h4>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Uses the job description saved when you last generated a tailored resume (same session as Resume Preview).
        </p>
        {!hasRoleJd ? (
          <div className="rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2.5 space-y-2">
            <p className="text-[11px] text-amber-950">
              No full JD in session yet (need about {MIN_JD_LEN}+ characters). Generate a resume from a posting first, or paste the JD in chat and generate again.
            </p>
            <Button variant="ghost" size="sm" type="button" onClick={onSwitchToResume}>
              Open Resume Preview
            </Button>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-ink-faint truncate" title={sessionJd ?? undefined}>
            JD loaded ({sessionJd?.length ?? 0} chars)
          </p>
        )}
        <Button
          variant="primary"
          size="sm"
          type="button"
          loading={roleLoading}
          disabled={!hasRoleJd}
          onClick={generateRole}
        >
          Generate role-specific questions
        </Button>
        {roleError ? <p className="text-[11px] text-danger">{roleError}</p> : null}
        {jdStale && roleQuestions?.length ? (
          <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2 leading-relaxed">
            These role-specific questions were saved for a different session job description (or the JD was cleared). Regenerate to align with your current JD.
          </p>
        ) : null}
        {roleSavedAt && roleQuestions?.length ? (
          <p className="text-[10px] text-ink-faint">Saved {roleSavedAt}</p>
        ) : null}
        {roleQuestions?.length ? (
          <InterviewPrepCard questions={roleQuestions} showHeader={false} />
        ) : null}
      </section>

      <div className="border-t border-border pt-4 space-y-2">
        <h4 className="text-[11px] font-semibold text-ink">General prep (any interview)</h4>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Behavioral, situational, and technical-style questions personalized from your KB — not tied to a specific posting.
        </p>
        <Button variant="primary" size="sm" type="button" loading={generalLoading} onClick={generateGeneral}>
          Generate general questions
        </Button>
        {generalError ? <p className="text-[11px] text-danger">{generalError}</p> : null}
        {generalSavedAt && generalQuestions?.length ? (
          <p className="text-[10px] text-ink-faint">Saved {generalSavedAt}</p>
        ) : null}
        {generalQuestions?.length ? (
          <InterviewPrepCard questions={generalQuestions} showHeader={false} />
        ) : null}
      </div>
    </div>
  );
}
