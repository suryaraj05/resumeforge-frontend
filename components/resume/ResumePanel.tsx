"use client";

import React, { useState, useEffect } from "react";
import { RefinedResume, ATSScoreResult, ResumeTemplateId } from "@/types/resume";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui";
import api from "@/lib/api";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { AcademicTemplate } from "./templates/AcademicTemplate";
import { ATSScoreDisplay } from "./ATSScoreDisplay";
import { CoverLetterPanel } from "./CoverLetterPanel";

const TEMPLATES: { id: ResumeTemplateId; name: string }[] = [
  { id: "minimal", name: "Minimal" },
  { id: "modern", name: "Modern" },
  { id: "academic", name: "Academic" },
];

interface ResumePanelProps {
  resume: RefinedResume | null;
  ats: ATSScoreResult | null;
  coverLetter: string | null;
  onCoverLetterGenerated?: (text: string) => void;
  /** Long JD message in flight — show progress in this panel */
  generatingResume?: boolean;
  /** Bot asked for a full job description (100+ chars) before generation */
  awaitingJobDescription?: boolean;
}

const RESUME_GEN_STEPS = [
  "Reading your knowledge base…",
  "Tailoring bullets to the role…",
  "Checking ATS-style fit…",
  "Polishing your one-pager…",
] as const;

function injectResumeIndeterminateKeyframes() {
  if (typeof document === "undefined") return;
  const id = "__resume-indeterminate-kf";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes resumeIndeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
  `;
  document.head.appendChild(style);
}

function ResumeGeneratingPlaceholder() {
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    injectResumeIndeterminateKeyframes();
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(
      () => setStepIndex((i) => (i + 1) % RESUME_GEN_STEPS.length),
      8000
    );
    return () => window.clearInterval(t);
  }, []);

  const phase = stepIndex + 1;
  const total = RESUME_GEN_STEPS.length;

  return (
    <div className="flex-1 p-6 flex flex-col gap-4">
      <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Resume Preview</h3>
      <div className="rounded-lg border border-sage/30 bg-sage-light/40 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">Generating your resume</p>
          <span className="text-[10px] font-mono text-ink-muted tabular-nums">
            {elapsed}s
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/80 border border-border">
          <div
            className="h-full w-2/5 rounded-full bg-sage"
            style={{
              animation: "resumeIndeterminate 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          <span className="font-medium text-ink">
            Step {phase} of {total}
          </span>
          {" — "}
          {RESUME_GEN_STEPS[stepIndex]} Typical runs are about 30–90 seconds; large profiles can take longer.
        </p>
      </div>
    </div>
  );
}

function Thumbnail({ id, active }: { id: ResumeTemplateId; active: boolean }) {
  return (
    <div
      className={`h-10 rounded border flex items-center justify-center text-[7px] font-mono transition-colors ${
        active ? "border-sage bg-sage-light text-sage-dark" : "border-border bg-paper text-ink-faint"
      }`}
    >
      {id === "minimal" && <span className="flex flex-col gap-0.5 w-6"><span className="h-px bg-current" /><span className="h-px bg-current opacity-40" /></span>}
      {id === "modern" && <span className="flex gap-0.5 w-6 h-6"><span className="w-2 bg-sage/40 rounded-sm" /><span className="flex-1 border border-current rounded-sm opacity-50" /></span>}
      {id === "academic" && <span className="flex flex-col gap-px w-6">{[1, 2, 3, 4].map((i) => <span key={i} className="h-px bg-current opacity-40" />)}</span>}
    </div>
  );
}

export function ResumePanel({
  resume,
  ats,
  coverLetter,
  onCoverLetterGenerated,
  generatingResume = false,
  awaitingJobDescription = false,
}: ResumePanelProps) {
  const [template, setTemplate] = useState<ResumeTemplateId>("minimal");
  const [generatingCl, setGeneratingCl] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (generatingResume) injectResumeIndeterminateKeyframes();
  }, [generatingResume]);

  async function downloadPdf() {
    if (!resume || pdfLoading) return;
    const templateForPdf = template;
    setPdfLoading(true);
    toast(
      "Rendering your PDF (headless browser on the server). This often takes 5–30s — the button shows a spinner; please wait.",
      "info"
    );
    try {
      const res = await api.post(
        "/api/resume/pdf",
        { resumeJson: resume, template: templateForPdf },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${templateForPdf}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF saved — check your downloads folder.", "success");
    } catch {
      toast("PDF generation failed. Try again in a moment.", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  async function saveToApplications() {
    try {
      toast("Saving resume/cover letter into My Applications…", "info");
      await api.post("/api/applications/from-resume-session");
      toast("Saved to My Applications", "success");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Could not save to My Applications";
      toast(msg, "error");
    }
  }

  function downloadJson() {
    if (!resume) return;
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-refined.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("JSON downloaded", "success");
  }

  async function generateCoverLetter() {
    if (!resume) return;
    setGeneratingCl(true);
    try {
      const session = await api.get<{ jd?: string; latestResume?: RefinedResume }>("/api/resume/session");
      const jd = session.data?.jd;
      if (!jd) {
        toast("No job description in session. Generate a resume from a JD first.", "error");
        return;
      }
      const res = await api.post<{ text: string }>("/api/resume/cover-letter", {
        jd,
        resumeJson: resume,
      });
      onCoverLetterGenerated?.(res.data.text);
      toast("Cover letter generated", "success");
    } catch {
      toast("Cover letter failed", "error");
    } finally {
      setGeneratingCl(false);
    }
  }

  if (!resume) {
    if (generatingResume) {
      return <ResumeGeneratingPlaceholder />;
    }
    return (
      <div className="flex-1 p-6 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Resume Preview</h3>
        {awaitingJobDescription ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-3 space-y-2">
            <p className="text-xs font-medium text-amber-950">Paste the full job description</p>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Generation starts only after you send a job posting with at least about 100 characters (title, responsibilities, and requirements). Use the chat box on the left — this panel will show progress once a full JD is in flight.
            </p>
          </div>
        ) : null}
        <p className="text-xs text-ink-muted">
          Ask me to generate a tailored resume and paste a job description. Your curated one-pager, ATS score, and templates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 min-h-0">
      {generatingResume && (
        <div className="shrink-0 rounded-md border border-sage/30 bg-sage-light/50 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink">Regenerating resume…</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/80 border border-border">
            <div
              className="h-full w-2/5 rounded-full bg-sage"
              style={{
                animation: "resumeIndeterminate 1.4s ease-in-out infinite",
              }}
            />
          </div>
          <p className="text-[10px] text-ink-muted">
            Keep this tab open. Typical time: 30–90 seconds.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Templates</h3>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={downloadJson} disabled={pdfLoading}>
              JSON
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={pdfLoading}
              onClick={downloadPdf}
              aria-busy={pdfLoading}
            >
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!resume) return;
                try {
                  localStorage.setItem("rf_resume_full_template", template);
                } catch {
                  /* ignore */
                }
                window.open(
                  `/chat/resume-full?template=${encodeURIComponent(template)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              disabled={!resume || pdfLoading}
            >
              Full preview
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void saveToApplications()} disabled={!resume || pdfLoading}>
              Save to Applications
            </Button>
          </div>
          {pdfLoading ? (
            <p className="text-[9px] text-ink-muted text-right max-w-[220px] leading-snug">
              Please wait — duplicate clicks queue extra work on the server.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={pdfLoading}
            onClick={() => setTemplate(t.id)}
            className="flex-1 flex flex-col items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Thumbnail id={t.id} active={template === t.id} />
            <span className={`text-[9px] font-medium ${template === t.id ? "text-sage" : "text-ink-faint"}`}>
              {t.name}
            </span>
          </button>
        ))}
      </div>

      <div
        className="border border-border rounded-md bg-white overflow-hidden"
        style={{ aspectRatio: "210 / 297" }}
      >
        <div className="h-full overflow-y-auto p-3 bg-paper">
          {template === "minimal" && <MinimalTemplate resume={resume} />}
          {template === "modern" && <ModernTemplate resume={resume} />}
          {template === "academic" && <AcademicTemplate resume={resume} />}
        </div>
      </div>

      {ats && <ATSScoreDisplay ats={ats} />}

      {!coverLetter && (
        <Button variant="ghost" className="w-full" size="sm" loading={generatingCl} onClick={generateCoverLetter}>
          Generate cover letter
        </Button>
      )}

      <CoverLetterPanel text={coverLetter} />
    </div>
  );
}
