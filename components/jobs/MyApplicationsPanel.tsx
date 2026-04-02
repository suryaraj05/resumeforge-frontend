"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Spinner } from "@/components/ui";
import { CoverLetterPanel } from "@/components/resume/CoverLetterPanel";
import { MinimalTemplate } from "@/components/resume/templates/MinimalTemplate";
import type { ApplicationDoc, ApplicationStatus } from "@/types/jobs";
import type { RefinedResume } from "@/types/resume";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui";

type CompanyIntel = {
  interviewStyle?: string;
  commonQuestions?: string[];
  cultureFit?: string;
  redFlags?: string;
  insiderTip?: string;
};

type InterviewQuestion = {
  id: number;
  type?: string;
  difficulty?: string;
  question: string;
  hints?: string[];
  followUp?: string;
};

type InterviewAnswer = {
  questionId: number;
  answer: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
};

type StoredInterviewQuestion = {
  type?: string;
  question?: string;
  q?: string;
  hint: string;
  answer: string;
};

type InterviewPrepSavedDoc = {
  mode: "general" | "role";
  jdFingerprint: string | null;
  questions: StoredInterviewQuestion[];
  updatedAt: string;
};

type InterviewSession = {
  sessionId: string;
  applicationId?: string | null;
  company: string;
  role: string;
  jdText: string;
  companyIntel?: CompanyIntel | null;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  readinessReport?: {
    overallScore?: number;
    readinessLevel?: string;
  } | null;
  createdAt?: string;
};

// Include "saved" because chat-generated resume/cover-letter is stored as a saved application
// until the user moves it forward from the tracker.
const INCLUDED_STATUSES: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

export function MyApplicationsPanel() {
  const toast = useToast();
  const [byStatus, setByStatus] = useState<Record<ApplicationStatus, ApplicationDoc[]>>({
    saved: [],
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  });
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [interviewPrep, setInterviewPrep] = useState<{ general: InterviewPrepSavedDoc | null; role: InterviewPrepSavedDoc | null }>({
    general: null,
    role: null,
  });
  const [rolePrepMatchesByAppId, setRolePrepMatchesByAppId] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const appsRes = await api.get<{
          byStatus: Record<ApplicationStatus, ApplicationDoc[]>;
          all: ApplicationDoc[];
        }>("/api/applications");
        if (cancelled) return;
        setByStatus(appsRes.data.byStatus ?? byStatus);

        const sessRes = await api.get<{ sessions: InterviewSession[] }>("/api/interview/sessions");
        if (cancelled) return;
        setSessions(sessRes.data.sessions ?? []);

        const prepRes = await api.get<{ general: InterviewPrepSavedDoc | null; role: InterviewPrepSavedDoc | null }>(
          "/api/chat/interview-prep"
        );
        if (cancelled) return;
        setInterviewPrep({
          general: prepRes.data.general ?? null,
          role: prepRes.data.role ?? null,
        });
      } catch {
        // Keep empty lists; panel will show nothing instead of crashing.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!interviewPrep.role?.jdFingerprint) return;
      const targetFp = interviewPrep.role.jdFingerprint;
      const apps = INCLUDED_STATUSES.flatMap((s) => byStatus[s] ?? []);
      const out: Record<string, boolean> = {};
      // Compute fingerprint using the same logic as the backend (sha256 hex, slice 0..24).
      async function jdFingerprint(jdText: string): Promise<string> {
        const enc = new TextEncoder();
        const data = enc.encode(jdText.trim());
        const hashBuf = await crypto.subtle.digest("SHA-256", data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hex = hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
        return hex.slice(0, 24);
      }

      for (const a of apps) {
        try {
          const fp = await jdFingerprint(a.jdText ?? "");
          out[a.applicationId] = fp === targetFp;
        } catch {
          out[a.applicationId] = false;
        }
      }
      if (!cancelled) setRolePrepMatchesByAppId(out);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [byStatus, interviewPrep.role?.jdFingerprint]);

  const applications = useMemo(() => {
    const all = INCLUDED_STATUSES.flatMap((s) => byStatus[s] ?? []);
    // Prefer stable ordering: newest createdAt is not always available, so keep API ordering.
    return all;
  }, [byStatus]);

  const latestSessionByAppId = useMemo(() => {
    const m = new Map<string, InterviewSession>();
    for (const s of sessions) {
      const appId = s.applicationId ?? undefined;
      if (!appId) continue;
      if (!m.has(appId)) m.set(appId, s);
    }
    return m;
  }, [sessions]);

  async function downloadResumePdf(resumeJson: RefinedResume) {
    try {
      const res = await api.post(
        "/api/resume/pdf",
        { resumeJson, template: "minimal" },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast("Resume PDF downloaded", "success");
    } catch {
      toast("Resume PDF download failed", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-10">
        <Spinner className="text-sage" />
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-semibold text-ink uppercase tracking-wide">My Applications</p>
        <p className="text-xs text-ink-muted leading-relaxed">
          You don&apos;t have any applied jobs yet. Go to <Link href="/jobs" className="text-sage hover:underline">Jobs</Link> and prepare an application pack.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">My Applications</h3>
        <p className="text-[10px] text-ink-muted mt-1">
          Resume, cover letter, and interview Q&amp;A for applied jobs.
        </p>
      </div>

      <div className="space-y-3">
        {applications.map((a) => {
          const session = latestSessionByAppId.get(a.applicationId);
          const resumeJson = a.resumeJson as RefinedResume | undefined | null;
          const coverLetter = a.coverLetter ?? null;

          return (
            <details key={a.applicationId} className="border border-border rounded-md bg-paper overflow-hidden">
              <summary className="cursor-pointer px-3 py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{a.company}</p>
                  <p className="text-[10px] text-ink-muted truncate">{a.jobTitle}</p>
                  <p className="text-[10px] font-mono text-ink-faint mt-1">{a.fitScore}% fit · {a.status}</p>
                </div>
                <div className="flex-shrink-0 text-[10px] text-sage font-medium">
                  {session ? "Interview Q&A ready" : "No interview session yet"}
                </div>
              </summary>

              <div className="px-3 pb-3 space-y-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">Resume</p>
                  {resumeJson ? (
                    <div className="border border-border rounded-md bg-white overflow-hidden">
                      <div className="max-h-[220px] overflow-y-auto p-2">
                        <MinimalTemplate resume={resumeJson} />
                      </div>
                      <div className="p-2 border-t border-border flex gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => void downloadResumePdf(resumeJson)}>
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">Resume not generated for this application yet.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">Cover letter</p>
                  {coverLetter ? (
                    <CoverLetterPanel text={coverLetter} />
                  ) : (
                    <p className="text-xs text-ink-muted">Cover letter not generated for this application yet.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">Interview Q&amp;A</p>

                  {session ? (
                    <div className="space-y-3">
                      {session.companyIntel ? (
                        <div className="border border-border rounded-md bg-white p-2 space-y-2">
                          {session.companyIntel.interviewStyle ? (
                            <p className="text-xs">
                              <span className="font-semibold">Style:</span> {session.companyIntel.interviewStyle}
                            </p>
                          ) : null}
                          {session.companyIntel.commonQuestions?.length ? (
                            <div>
                              <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">Common questions</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-ink-muted">
                                {session.companyIntel.commonQuestions.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {session.companyIntel.redFlags ? (
                            <p className="text-xs">
                              <span className="font-semibold">Red flags:</span> {session.companyIntel.redFlags}
                            </p>
                          ) : null}
                          {session.companyIntel.insiderTip ? (
                            <p className="text-xs">
                              <span className="font-semibold">Insider tip:</span> {session.companyIntel.insiderTip}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-muted">Company intel not generated yet (Gemini config missing?).</p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/jobs/interview/${session.sessionId}`}
                          className="text-xs font-medium bg-sage text-white rounded px-3 py-1.5 hover:opacity-90"
                        >
                          Open interview session
                        </Link>
                        {session.readinessReport?.readinessLevel ? (
                          <span className="text-[10px] font-mono text-ink-faint self-center">
                            Readiness: {session.readinessReport.readinessLevel}
                          </span>
                        ) : null}
                      </div>

                      <div className="border border-border rounded-md bg-white p-2 space-y-2 max-h-[280px] overflow-y-auto">
                        {session.questions.map((q) => {
                          const ans = session.answers?.find((x) => x.questionId === q.id);
                          return (
                            <div key={q.id} className="space-y-1 border-b border-border/60 pb-2 last:border-b-0">
                              <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">
                                Q{q.id} {q.type ? `· ${q.type}` : ""}
                              </p>
                              <p className="text-xs text-ink-muted leading-relaxed">{q.question}</p>
                              <p className="text-xs leading-relaxed">
                                <span className="font-semibold">Your answer:</span>{" "}
                                {ans?.answer?.trim() ? ans.answer : <span className="text-ink-faint">Not answered yet</span>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : interviewPrep.role && rolePrepMatchesByAppId[a.applicationId] ? (
                    <div className="space-y-2">
                      <div className="border border-border rounded-md bg-white p-2 space-y-2 max-h-[280px] overflow-y-auto">
                        {interviewPrep.role.questions.map((q, idx) => (
                          <div key={idx} className="space-y-1 border-b border-border/60 pb-2 last:border-b-0">
                            <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">
                              Q{idx + 1} {q.type ? `· ${q.type}` : ""}
                            </p>
                            <p className="text-xs text-ink-muted leading-relaxed">{(q.question ?? q.q ?? "").toString()}</p>
                            {q.hint ? <p className="text-xs"><span className="font-semibold">Hint:</span> {q.hint}</p> : null}
                            <p className="text-xs leading-relaxed">
                              <span className="font-semibold">Your draft answer:</span>{" "}
                              {q.answer?.trim() ? q.answer : <span className="text-ink-faint">Not answered yet</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/jobs/interview/new?company=${encodeURIComponent(a.company)}&role=${encodeURIComponent(a.jobTitle)}&applicationId=${encodeURIComponent(a.applicationId)}`}
                          className="inline-flex text-xs font-medium bg-sage text-white rounded px-3 py-1.5 hover:opacity-90"
                        >
                          Start interview session
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-ink-muted">No company interview session yet. Showing saved interview prep.</p>
                      {interviewPrep.general ? (
                        <div className="border border-border rounded-md bg-white p-2 space-y-2 max-h-[280px] overflow-y-auto">
                          {interviewPrep.general.questions.map((q, idx) => (
                            <div key={idx} className="space-y-1 border-b border-border/60 pb-2 last:border-b-0">
                              <p className="text-[10px] font-semibold text-ink uppercase tracking-wide">
                                Q{idx + 1} {q.type ? `· ${q.type}` : ""}
                              </p>
                              <p className="text-xs text-ink-muted leading-relaxed">{(q.question ?? q.q ?? "").toString()}</p>
                              {q.hint ? <p className="text-xs"><span className="font-semibold">Hint:</span> {q.hint}</p> : null}
                              <p className="text-xs leading-relaxed">
                                <span className="font-semibold">Your draft answer:</span>{" "}
                                {q.answer?.trim() ? q.answer : <span className="text-ink-faint">Not answered yet</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <Link
                        href={`/jobs/interview/new?company=${encodeURIComponent(a.company)}&role=${encodeURIComponent(a.jobTitle)}&applicationId=${encodeURIComponent(a.applicationId)}`}
                        className="inline-flex text-xs font-medium bg-sage text-white rounded px-3 py-1.5 hover:opacity-90"
                      >
                        Start interview prep
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

