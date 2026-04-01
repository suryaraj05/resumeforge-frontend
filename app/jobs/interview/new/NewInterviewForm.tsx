"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

export default function NewInterviewForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const companyQ = sp.get("company") ?? "";
  const roleQ = sp.get("role") ?? "";
  const applicationId = sp.get("applicationId");

  const [company, setCompany] = useState(companyQ);
  const [role, setRole] = useState(roleQ);
  const [jd, setJd] = useState("");
  const [mode, setMode] = useState<"chat_qa" | "timed_mock">("chat_qa");
  const [focus, setFocus] = useState<"technical" | "behavioral" | "mixed">("mixed");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!applicationId || !user) return;
    api
      .get<{ jdText: string; company: string; jobTitle: string }>(`/api/applications/${applicationId}`)
      .then((r) => {
        setJd(r.data.jdText ?? "");
        setCompany(r.data.company);
        setRole(r.data.jobTitle);
      })
      .catch(() => {});
  }, [applicationId, user]);

  async function start() {
    if (!company.trim() || !role.trim() || jd.trim().length < 40) return;
    setBusy(true);
    try {
      const res = await api.post<{ sessionId: string }>("/api/interview/session/start", {
        applicationId: applicationId ?? undefined,
        company: company.trim(),
        role: role.trim(),
        jdText: jd.trim(),
        mode,
        focus,
      });
      router.push(`/jobs/interview/${res.data.sessionId}`);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner className="text-sage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink p-6 max-w-lg mx-auto">
      <Link href="/jobs" className="text-xs text-sage mb-4 inline-block">
        ← Back
      </Link>
      <h1 className="font-serif text-xl font-medium">Interview session</h1>
      <p className="text-sm text-ink-muted mt-1">Company intel, 10 questions, and a readiness scorecard.</p>

      <div className="mt-6 space-y-4 text-sm">
        <div>
          <label className="text-xs text-ink-muted">Company</label>
          <input className="w-full mt-1 border border-border rounded px-3 py-2 bg-paper" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-ink-muted">Role</label>
          <input className="w-full mt-1 border border-border rounded px-3 py-2 bg-paper" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-ink-muted">Job description</label>
          <textarea
            className="w-full mt-1 border border-border rounded px-3 py-2 bg-paper min-h-[160px] text-xs"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste JD (40+ characters)…"
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="text-xs text-ink-muted block">Mode</label>
            <select className="mt-1 border border-border rounded px-2 py-1.5 bg-paper text-xs" value={mode} onChange={(e) => setMode(e.target.value as "chat_qa" | "timed_mock")}>
              <option value="chat_qa">Chat Q&amp;A</option>
              <option value="timed_mock">Timed mock</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-muted block">Focus</label>
            <select className="mt-1 border border-border rounded px-2 py-1.5 bg-paper text-xs" value={focus} onChange={(e) => setFocus(e.target.value as "technical" | "behavioral" | "mixed")}>
              <option value="mixed">Mixed</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          disabled={busy || jd.trim().length < 40}
          onClick={() => void start()}
          className="w-full py-2.5 bg-sage text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Starting…" : "Start session"}
        </button>
      </div>
    </div>
  );
}
