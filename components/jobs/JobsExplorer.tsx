"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner, useToast } from "@/components/ui";
import type { ScoredJob, JobSearchProfile, WeakSpotReport } from "@/types/jobs";
import type { RefinedResume, ATSScoreResult } from "@/types/resume";

const LOCATIONS = [
  "Remote",
  "USA",
  "UK",
  "Germany",
  "Australia",
  "India (Remote)",
  "Indian Startups",
] as const;

const ROLE_TYPES = ["Full-time", "Internship", "Contract"] as const;
const POSTED = ["Last 24h", "Last 3 days", "Last week"] as const;

function daysAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const d = Math.floor((Date.now() - t) / (86400 * 1000));
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

function isFresh(iso?: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Date.now() - t < 3 * 86400 * 1000;
}

function companyInitials(company: string): string {
  const parts = company.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** API requires ≥80 chars of JD; listings sometimes omit or truncate description. */
function jdForResumePack(job: ScoredJob): string {
  let raw = (job.description ?? "").trim();
  if (raw.includes("<")) {
    const stripped = stripHtmlToText(raw);
    if (stripped.length >= 40) raw = stripped;
  }
  if (raw.length >= 80) return raw;

  const lines: string[] = [];
  lines.push(`Job title: ${job.title}`);
  lines.push(`Company: ${job.company}`);
  if (job.location?.trim()) lines.push(`Location: ${job.location.trim()}`);
  if (job.salary?.trim()) lines.push(`Compensation: ${job.salary.trim()}`);
  if (job.applyUrl?.trim()) lines.push(`Apply / posting URL: ${job.applyUrl.trim()}`);
  if (job.score?.whyThisRole?.trim()) lines.push(`Fit summary: ${job.score.whyThisRole.trim()}`);
  if (job.score?.matchedSkills?.length)
    lines.push(`Skills aligned with this role: ${job.score.matchedSkills.join(", ")}`);
  if (job.score?.missingSkills?.length)
    lines.push(`Related skills to emphasize or develop: ${job.score.missingSkills.join(", ")}`);
  if (job.score?.startupSignals?.trim())
    lines.push(`Additional signals: ${job.score.startupSignals.trim()}`);
  const aug = lines.join("\n");
  let combined = raw ? `${raw}\n\n---\n${aug}` : aug;
  combined = combined.trim();
  if (combined.length < 80) {
    combined = `${combined}\n\nTailor the resume to this role using the title, company, and fit summary. Infer typical responsibilities for this title where the full posting was unavailable.`;
  }
  return combined.trim();
}

function JobCompanyAvatar({ job }: { job: ScoredJob }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = job.logoUrl && !imgFailed;
  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={job.logoUrl}
        alt=""
        className="w-10 h-10 rounded object-contain bg-white border border-border shrink-0"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded border border-border bg-sage-light/40 flex items-center justify-center text-[11px] font-semibold text-sage-dark shrink-0">
      {companyInitials(job.company)}
    </div>
  );
}

function FitRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-sage" : score >= 40 ? "text-amber-600" : "text-ink-muted";
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className={`relative w-11 h-11 ${color}`}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <path
          className="text-border"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${pct}, 100`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold">
        {pct}
      </span>
    </div>
  );
}

export default function JobsExplorer() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const urlJobId = searchParams.get("jobId");

  const [profile, setProfile] = useState<JobSearchProfile | null>(null);
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [weakReport, setWeakReport] = useState<WeakSpotReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string>("Remote");
  const [roleType, setRoleType] = useState<string>("Full-time");
  const [posted, setPosted] = useState<string>("Last week");
  const [minFit, setMinFit] = useState(0);
  const [salaryOnly, setSalaryOnly] = useState(false);
  const [selected, setSelected] = useState<ScoredJob | null>(null);
  const [weakBannerOpen, setWeakBannerOpen] = useState(false);
  const [salarySnippet, setSalarySnippet] = useState<string | null>(null);
  const [packOpen, setPackOpen] = useState(false);
  const [packStep, setPackStep] = useState<"confirm" | "running" | "done">("confirm");
  const [packChecks, setPackChecks] = useState({ resume: false, ats: false, letter: false });
  const [packResume, setPackResume] = useState<RefinedResume | null>(null);
  const [packAts, setPackAts] = useState<ATSScoreResult | null>(null);
  const [packLetter, setPackLetter] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      const res = await api.get<{
        jobs: ScoredJob[];
        weakSpotReport: WeakSpotReport | null;
      }>("/api/jobs/search", {
        params: {
          query: query || undefined,
          location,
          datePosted: posted,
          roleType,
        },
      });
      setJobs(res.data.jobs ?? []);
      setWeakReport(res.data.weakSpotReport ?? null);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, [query, location, posted, roleType]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const pr = await api.get<{ profile: JobSearchProfile }>("/api/jobs/profile");
        if (cancelled) return;
        const prof = pr.data.profile;
        setProfile(prof);
        const initialQ = prof.searchQueries[0] || "software engineer";
        setQuery((q) => (q.trim() ? q : initialQ));
        const sr = await api.get<{
          jobs: ScoredJob[];
          weakSpotReport: WeakSpotReport | null;
        }>("/api/jobs/search", {
          params: {
            query: initialQ,
            location: "Remote",
            datePosted: "Last week",
            roleType: "Full-time",
          },
        });
        if (cancelled) return;
        setJobs(sr.data.jobs ?? []);
        setWeakReport(sr.data.weakSpotReport ?? null);
      } catch {
        /* profile/search errors */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!urlJobId || !jobs.length) return;
    const j = jobs.find((x) => x.jobId === urlJobId);
    if (j) setSelected(j);
  }, [urlJobId, jobs]);

  useEffect(() => {
    if (!selected) {
      setSalarySnippet(null);
      return;
    }
    let cancelled = false;
    api
      .get<{ snippet: string }>("/api/jobs/salary-intel", {
        params: { company: selected.company, role: selected.title },
      })
      .then((r) => {
        if (!cancelled) setSalarySnippet(r.data.snippet);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selected?.jobId, selected?.company, selected?.title]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (j.score.fitScore < minFit) return false;
      if (salaryOnly && !j.salary) return false;
      return true;
    });
  }, [jobs, minFit, salaryOnly]);

  async function runPack() {
    if (!selected) return;
    const jd = jdForResumePack(selected);
    setPackStep("running");
    setPackChecks({ resume: false, ats: false, letter: false });
    try {
      const gen = await api.post<{ refinedResume: RefinedResume; atsScore: ATSScoreResult }>(
        "/api/resume/generate",
        { jd }
      );
      setPackResume(gen.data.refinedResume);
      setPackChecks((c) => ({ ...c, resume: true, ats: true }));
      setPackAts(gen.data.atsScore);

      const cl = await api.post<{ text: string }>("/api/resume/cover-letter", {
        jd,
        resumeJson: gen.data.refinedResume,
      });
      setPackLetter(cl.data.text);
      setPackChecks((c) => ({ ...c, letter: true }));

      await api.post("/api/applications", {
        ...selected,
        description: jd,
        status: "saved",
        resumeJson: gen.data.refinedResume,
        coverLetter: cl.data.text,
        atsScore: gen.data.atsScore.score,
      });
      setPackStep("done");
    } catch (e: unknown) {
      setPackStep("confirm");
      let msg = "Could not generate the application pack. Try again.";
      if (axios.isAxiosError(e)) {
        const body = e.response?.data;
        const serverErr =
          body && typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : "";
        if (e.response?.status === 400) {
          msg = serverErr || "Request was rejected — check resume upload and try again.";
        } else if (e.response?.status === 404) {
          msg = serverErr || "No knowledge base found. Upload a resume first.";
        } else if (e.response?.status === 503) {
          msg = serverErr || "AI is not configured on the server.";
        } else if (e.response?.status && e.response.status >= 500) {
          msg = serverErr || "Server error during generation. Try again shortly.";
        }
      }
      toast(msg, "error");
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
    <div className="min-h-screen bg-paper text-ink">
      <header className="h-12 border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-sm font-semibold">
            Resume<span className="text-sage">Forge</span>
          </Link>
          <span className="text-xs text-ink-muted font-mono">jobs</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {profile?.primaryRoles?.length ? (
            <span className="text-[10px] text-ink-muted hidden sm:block max-w-[12rem] truncate text-right">
              {profile.primaryRoles.slice(0, 2).join(" · ")}
            </span>
          ) : null}
          <Link href="/jobs/tracker" className="text-xs font-medium text-sage hover:underline">
            Application tracker
          </Link>
        </div>
      </header>

      {weakReport?.topGaps?.length ? (
        <button
          type="button"
          onClick={() => setWeakBannerOpen((o) => !o)}
          className="w-full text-left px-4 py-2 bg-sage-light/50 border-b border-border text-xs text-ink hover:bg-sage-light/70"
        >
          <strong>{weakReport.topGaps.length} skills</strong> could improve your match rate —{" "}
          {weakBannerOpen ? "hide" : "show"} gap report
        </button>
      ) : null}
      {weakBannerOpen && weakReport ? (
        <div className="px-4 py-3 border-b border-border bg-paper text-sm space-y-2">
          <p className="text-ink-muted">{weakReport.summary}</p>
          <ul className="list-disc pl-4 space-y-1">
            {weakReport.topGaps.map((g) => (
              <li key={g.skill}>
                <strong>{g.skill}</strong> — {g.estimatedImpact} ({g.learningTimeEstimate})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row max-w-[1400px] mx-auto min-h-[calc(100vh-3rem)]">
        <section className="lg:w-[65%] border-b lg:border-b-0 lg:border-r border-border p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase tracking-wide text-ink-muted">Search</label>
              <input
                className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-paper"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Role, skills, stack…"
              />
            </div>
            <button
              type="button"
              disabled={searching}
              onClick={() => runSearch()}
              className="px-4 py-2 text-sm font-medium bg-sage text-white rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          <p className="text-[10px] text-ink-muted">
            Each search syncs roles to your tracker (Saved), keyed by job — re-search updates fit scores and links without resetting your stage.
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <select
              className="border border-border rounded px-2 py-1.5 bg-paper"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className="border border-border rounded px-2 py-1.5 bg-paper"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
            >
              {ROLE_TYPES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className="border border-border rounded px-2 py-1.5 bg-paper"
              value={posted}
              onChange={(e) => setPosted(e.target.value)}
            >
              {POSTED.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1">
              <span className="text-ink-muted">Min fit</span>
              <input
                type="range"
                min={0}
                max={100}
                value={minFit}
                onChange={(e) => setMinFit(Number(e.target.value))}
              />
              <span className="font-mono w-8">{minFit}%</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={salaryOnly} onChange={(e) => setSalaryOnly(e.target.checked)} />
              Salary data only
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner className="text-sage" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <article
                  key={job.jobId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(job)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(job)}
                  className={`border rounded-md p-3 text-left cursor-pointer transition-colors ${
                    selected?.jobId === job.jobId ? "border-sage bg-sage-light/20" : "border-border hover:bg-sage-light/10"
                  }`}
                >
                  <div className="flex gap-3">
                    <JobCompanyAvatar job={job} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-ink-muted">{job.company}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {job.location}
                        {job.isRemote ? (
                          <span className="ml-2 px-1.5 py-px rounded bg-sage-light text-sage-dark">Remote</span>
                        ) : null}
                        <span className="ml-2">{daysAgo(job.postedAt)}</span>
                        {isFresh(job.postedAt) ? (
                          <span className="ml-2 text-sage-dark" title="Fresh">
                            🟢 Fresh
                          </span>
                        ) : null}
                      </p>
                      {job.score.whyThisRole ? (
                        <p className="text-xs italic text-ink-muted mt-1">{job.score.whyThisRole}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.score.matchedSkills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-px rounded bg-sage-light text-sage-dark">
                            {s}
                          </span>
                        ))}
                        {job.score.missingSkills[0] ? (
                          <span className="text-[10px] px-1.5 py-px rounded bg-red-50 text-red-800/80">
                            {job.score.missingSkills[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <FitRing score={job.score.fitScore} />
                  </div>
                  {job.salary ? (
                    <p className="text-[11px] font-mono text-ink-muted mt-2">{job.salary}</p>
                  ) : null}
                  {job.score.startupSignals ? (
                    <p className="text-[10px] text-ink-muted mt-1">{job.score.startupSignals}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    {job.applyUrl ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-sage hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View posting
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="text-xs bg-sage text-white rounded px-2 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(job);
                        setPackOpen(true);
                        setPackStep("confirm");
                      }}
                    >
                      Prepare for this job
                    </button>
                  </div>
                </article>
              ))}
              {!filtered.length ? (
                <p className="text-sm text-ink-muted py-8 text-center">No jobs match filters.</p>
              ) : null}
            </div>
          )}
        </section>

        <aside className="lg:w-[35%] lg:sticky lg:top-0 lg:self-start max-h-screen overflow-y-auto border-border p-4 space-y-4">
          {!selected ? (
            <p className="text-sm text-ink-muted">Select a job to see details, salary intel, and application pack.</p>
          ) : (
            <>
              <h2 className="font-serif text-lg font-medium">{selected.title}</h2>
              <p className="text-sm text-ink-muted">
                {selected.company} · {selected.location}
              </p>
              {selected.applyUrl ? (
                <a
                  href={selected.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm font-medium text-sage hover:underline"
                >
                  Open original job posting →
                </a>
              ) : (
                <p className="text-[11px] text-ink-muted mt-2">No apply link on this listing.</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-ink-muted uppercase tracking-wide">Matched</p>
                  <ul className="mt-1 space-y-0.5">
                    {selected.score.matchedSkills.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-ink-muted uppercase tracking-wide">Missing</p>
                  <ul className="mt-1 space-y-0.5">
                    {selected.score.missingSkills.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase text-ink-muted">Salary intelligence</p>
                <p className="text-xs mt-1 whitespace-pre-wrap">{salarySnippet ?? "Loading…"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-ink-muted">Full description</p>
                <div className="mt-1 max-h-48 overflow-y-auto text-xs text-ink-muted border border-border rounded p-2">
                  {selected.description.slice(0, 8000)}
                </div>
              </div>
              <Link
                href={`/jobs/interview/new?company=${encodeURIComponent(selected.company)}&role=${encodeURIComponent(selected.title)}`}
                className="inline-block text-xs text-sage font-medium hover:underline"
              >
                Start interview prep for this role →
              </Link>
            </>
          )}
        </aside>
      </div>

      {packOpen && selected ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-border rounded-lg max-w-md w-full p-4 shadow-lg">
            {packStep === "confirm" ? (
              <>
                <p className="text-sm">
                  I&apos;ll generate a tailored resume, cover letter, and ATS check for{" "}
                  <strong>{selected.title}</strong> at <strong>{selected.company}</strong>. Takes ~15–30s. Go ahead?
                </p>
                <div className="flex gap-2 mt-4 justify-end">
                  <button type="button" className="text-xs px-3 py-1.5 border rounded" onClick={() => setPackOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 bg-sage text-white rounded"
                    onClick={() => void runPack()}
                  >
                    Confirm
                  </button>
                </div>
              </>
            ) : null}
            {packStep === "running" || packStep === "done" ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Application pack</p>
                <ul className="text-xs space-y-1 font-mono">
                  <li>{packChecks.resume ? "✓" : "…"} Resume curated</li>
                  <li>{packChecks.ats ? "✓" : "…"} ATS checked</li>
                  <li>{packChecks.letter ? "✓" : "…"} Cover letter written</li>
                </ul>
                {packStep === "done" && packResume ? (
                  <div className="mt-3 text-xs border-t border-border pt-2 space-y-2">
                    <p>ATS: {packAts?.score ?? "—"}/100</p>
                    {packLetter ? <p className="italic whitespace-pre-wrap line-clamp-6">{packLetter}</p> : null}
                    <Link href="/chat" className="text-sage block">
                      Open chat for PDF export from Resume panel →
                    </Link>
                  </div>
                ) : null}
                {packStep === "done" ? (
                  <button type="button" className="text-xs mt-2 underline" onClick={() => setPackOpen(false)}>
                    Close
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
