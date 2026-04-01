import React from "react";
import { RefinedResume } from "@/types/resume";

export function ModernTemplate({ resume }: { resume: RefinedResume }) {
  return (
    <div className="flex gap-2 text-[8px] leading-snug font-serif min-h-[280px]">
      <aside className="w-[30%] shrink-0 bg-sage-light border border-sage/20 rounded-sm p-2">
        <h2 className="text-[7px] uppercase tracking-widest text-sage-dark border-b border-sage/30 pb-0.5 mb-1">Education</h2>
        {(resume.education ?? []).map((e, i) => (
          <div key={i} className="mb-1.5">
            <p className="font-semibold text-[8px]">{e.institution}</p>
            <p className="font-mono text-[7px] text-ink-muted">{e.degree}</p>
          </div>
        ))}
        <h2 className="text-[7px] uppercase tracking-widest text-sage-dark border-b border-sage/30 pb-0.5 mb-1 mt-2">Skills</h2>
        <div className="text-[7.5px] text-ink-muted space-y-0.5">
          {resume.skills?.technical?.length ? <p><strong className="text-ink">Tech:</strong> {resume.skills.technical.join(", ")}</p> : null}
          {resume.skills?.tools?.length ? <p><strong className="text-ink">Tools:</strong> {resume.skills.tools.join(", ")}</p> : null}
        </div>
        {resume.certifications?.length ? (
          <>
            <h2 className="text-[7px] uppercase tracking-widest text-sage-dark border-b border-sage/30 pb-0.5 mb-1 mt-2">Certs</h2>
            {resume.certifications.map((c, i) => (
              <p key={i} className="text-[7px]">{c.name}</p>
            ))}
          </>
        ) : null}
      </aside>
      <div className="flex-1 min-w-0 py-0.5">
        <h1 className="text-base font-bold text-ink">{resume.targetRole || "Candidate"}</h1>
        {resume.summary && <p className="text-[8px] text-ink-muted mt-1 mb-2">{resume.summary}</p>}
        <h2 className="text-[7px] uppercase tracking-widest text-sage border-b border-sage/40 pb-0.5 mb-1">Experience</h2>
        {(resume.experience ?? []).map((e, i) => (
          <div key={i} className="mb-1.5">
            <p className="font-bold text-[8.5px]">{e.role}</p>
            <p className="font-mono text-[7px] text-ink-faint">{e.company} · {e.startDate} – {e.endDate || "Present"}</p>
            <ul className="mt-0.5 pl-3 list-disc text-[7.5px] text-ink-muted">
              {(e.description ?? []).slice(0, 5).map((d, j) => <li key={j}>{d}</li>)}
            </ul>
          </div>
        ))}
        {resume.projects?.length ? (
          <>
            <h2 className="text-[7px] uppercase tracking-widest text-sage border-b border-sage/40 pb-0.5 mb-1 mt-2">Projects</h2>
            {resume.projects.map((p, i) => (
              <div key={i} className="mb-1">
                <strong className="text-[8px]">{p.name}</strong>
                {p.description && <p className="text-[7.5px] text-ink-muted">{p.description}</p>}
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
