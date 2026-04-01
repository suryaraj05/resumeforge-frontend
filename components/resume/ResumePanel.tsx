"use client";

import React, { useState } from "react";
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

export function ResumePanel({ resume, ats, coverLetter, onCoverLetterGenerated }: ResumePanelProps) {
  const [template, setTemplate] = useState<ResumeTemplateId>("minimal");
  const [generatingCl, setGeneratingCl] = useState(false);
  const toast = useToast();

  async function downloadPdf() {
    if (!resume) return;
    try {
      const res = await api.post(
        "/api/resume/pdf",
        { resumeJson: resume, template },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${template}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF download started", "success");
    } catch {
      toast("PDF generation failed", "error");
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
    return (
      <div className="flex-1 p-6 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Resume Preview</h3>
        <p className="text-xs text-ink-muted">
          Ask me to generate a tailored resume and paste a job description. Your curated one-pager, ATS score, and templates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 min-h-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wide">Templates</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={downloadJson}>JSON</Button>
          <Button variant="primary" size="sm" onClick={downloadPdf}>PDF</Button>
        </div>
      </div>

      <div className="flex gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            className="flex-1 flex flex-col items-center gap-1"
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
