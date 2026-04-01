"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

interface QItem {
  id: number;
  type: string;
  difficulty: string;
  question: string;
  hints: string[];
  followUp: string;
}

interface Session {
  sessionId: string;
  company: string;
  role: string;
  mode: string;
  questions: QItem[];
  answers: { questionId: number; answer: string; score?: number; modelAnswer?: string }[];
  complete: boolean;
  companyIntel?: {
    interviewStyle: string;
    commonQuestions: string[];
    cultureFit: string;
    insiderTip: string;
  } | null;
  readinessReport?: {
    overallScore: number;
    readinessLevel: string;
    strongestArea: string;
    weakestArea: string;
    suggestions: string[];
  } | null;
}

const READ_MS = 30_000;
const ANSWER_MS = 180_000;

export default function InterviewSessionPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [intelOpen, setIntelOpen] = useState(true);
  const [phase, setPhase] = useState<"read" | "answer">("read");
  const [remainMs, setRemainMs] = useState(READ_MS);

  const load = useCallback(async () => {
    const res = await api.get<Session>(`/api/interview/sessions/${sessionId}`);
    setSession(res.data);
  }, [sessionId]);

  useEffect(() => {
    if (authLoading || !user) return;
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user, load]);

  const nextQuestion = useMemo(() => {
    if (!session) return null;
    const answered = new Set(session.answers.map((a) => a.questionId));
    return session.questions.find((q) => !answered.has(q.id)) ?? null;
  }, [session]);

  useEffect(() => {
    if (!session || session.mode !== "timed_mock" || !nextQuestion || session.complete) return;
    setPhase("read");
    setRemainMs(READ_MS);
    const t0 = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - t0;
      if (elapsed < READ_MS) {
        setPhase("read");
        setRemainMs(READ_MS - elapsed);
      } else if (elapsed < READ_MS + ANSWER_MS) {
        setPhase("answer");
        setRemainMs(READ_MS + ANSWER_MS - elapsed);
      } else {
        setRemainMs(0);
      }
    }, 250);
    return () => clearInterval(id);
  }, [session?.sessionId, session?.mode, session?.complete, nextQuestion?.id]);

  async function submit() {
    if (!nextQuestion || !answer.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/interview/session/${sessionId}/answer`, {
        questionId: nextQuestion.id,
        answer: answer.trim(),
      });
      setAnswer("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner className="text-sage" />
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner className="text-sage" />
      </div>
    );
  }

  const barPct =
    session.mode === "timed_mock" && nextQuestion
      ? phase === "read"
        ? (remainMs / READ_MS) * 100
        : (remainMs / ANSWER_MS) * 100
      : 100;

  const barColor =
    session.mode === "timed_mock" && phase === "answer" && remainMs < 30_000
      ? "bg-red-400"
      : phase === "read"
        ? "bg-sage"
        : "bg-amber-500";

  return (
    <div className="min-h-screen bg-paper text-ink">
      {session.mode === "timed_mock" && nextQuestion ? (
        <div className="h-1 w-full bg-border">
          <div className={`h-full transition-all ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      ) : null}

      <div className="max-w-xl mx-auto p-6">
        <Link href="/jobs" className="text-xs text-sage">
          ← Jobs
        </Link>
        <h1 className="font-serif text-lg mt-2">
          {session.company} — {session.role}
        </h1>
        <p className="text-[10px] font-mono text-ink-muted uppercase mt-1">{session.mode.replace("_", " ")}</p>

        {session.companyIntel ? (
          <div className="mt-4 border border-border rounded-md p-3 text-xs">
            <button type="button" className="font-medium text-ink w-full text-left" onClick={() => setIntelOpen((o) => !o)}>
              Company intel {intelOpen ? "▼" : "▶"}
            </button>
            {intelOpen ? (
              <div className="mt-2 space-y-2 text-ink-muted">
                <p>{session.companyIntel.interviewStyle}</p>
                <ul className="list-disc pl-4">
                  {session.companyIntel.commonQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
                <p>{session.companyIntel.cultureFit}</p>
                <p className="text-sage-dark">{session.companyIntel.insiderTip}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {session.complete && session.readinessReport ? (
          <div className="mt-8 font-serif border border-border rounded-md p-6 bg-[#FAFAF7] space-y-4">
            <h2 className="text-lg font-medium">Readiness report</h2>
            <hr className="border-border" />
            <p className="text-4xl font-medium">{session.readinessReport.overallScore}</p>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Overall (of 5)</p>
            <p className="text-sm">{session.readinessReport.readinessLevel}</p>
            <p className="text-xs">
              Strongest: {session.readinessReport.strongestArea} · Weakest: {session.readinessReport.weakestArea}
            </p>
            <ul className="text-sm list-disc pl-4 space-y-1">
              {session.readinessReport.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : nextQuestion ? (
          <div className="mt-8 border border-border rounded-lg p-5 shadow-sm bg-paper">
            <div className="flex gap-2 text-[10px] uppercase tracking-wide">
              <span className="px-2 py-0.5 bg-sage-light text-sage-dark rounded">{nextQuestion.type}</span>
              <span className="px-2 py-0.5 bg-border/50 rounded">{nextQuestion.difficulty}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{nextQuestion.question}</p>
            {session.mode === "chat_qa" && (
              <p className="text-[10px] text-ink-muted mt-2">Hints: {nextQuestion.hints.join(" · ")}</p>
            )}
            <textarea
              className="w-full mt-4 border border-border rounded p-3 text-sm min-h-[120px] bg-paper"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer…"
            />
            <button
              type="button"
              disabled={submitting || !answer.trim()}
              onClick={() => void submit()}
              className="mt-3 w-full py-2 bg-sage text-white rounded text-sm disabled:opacity-50"
            >
              {submitting ? "Scoring…" : "Submit answer"}
            </button>
          </div>
        ) : (
          <p className="mt-8 text-sm text-ink-muted">Session complete.</p>
        )}

        {session.answers.length > 0 && !session.complete ? (
          <div className="mt-6 text-xs border-t border-border pt-4 space-y-2">
            <p className="font-medium">Last feedback</p>
            {session.answers.slice(-1).map((a) => (
              <div key={a.questionId}>
                <p>Score: {a.score ?? "—"}/5</p>
                {a.modelAnswer ? <p className="text-ink-muted mt-1">{a.modelAnswer}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
