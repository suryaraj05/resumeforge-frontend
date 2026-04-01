import React from "react";
import { RefinedResume } from "@/types/resume";

export function AcademicTemplate({ resume }: { resume: RefinedResume }) {
  return (
    <div className="text-[8px] leading-snug font-serif text-ink px-1">
      <h1 className="text-center text-[11px] font-bold uppercase tracking-[0.12em]">
        {resume.targetRole || "Curriculum Vitae"}
      </h1>
      <p className="text-center font-mono text-[7px] text-ink-faint mb-2">Summary</p>
      {resume.summary && <p className="text-justify text-[8px] text-ink-muted mb-2">{resume.summary}</p>}
      <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Education</h2>
      {(resume.education ?? []).map((e, i) => (
        <p key={i} className="mb-0.5">
          {e.degree}{e.field ? ` in ${e.field}` : ""}, {e.institution}, {e.startDate}–{e.endDate}
        </p>
      ))}
      <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Experience</h2>
      {(resume.experience ?? []).map((e, i) => (
        <div key={i} className="mb-1.5">
          <p>
            <strong>{e.role}</strong>, {e.company}{" "}
            <span className="font-mono text-ink-faint">({e.startDate}–{e.endDate})</span>
          </p>
          <ul className="pl-3 list-disc text-[7.5px] text-ink-muted">
            {(e.description ?? []).slice(0, 5).map((d, j) => <li key={j}>{d}</li>)}
          </ul>
        </div>
      ))}
      {resume.projects?.length ? (
        <>
          <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Projects</h2>
          <ul className="pl-3 list-disc">
            {resume.projects.map((p, i) => (
              <li key={i} className="text-[7.5px] mb-0.5"><strong>{p.name}</strong>{p.description ? ` — ${p.description}` : ""}</li>
            ))}
          </ul>
        </>
      ) : null}
      {resume.publications?.length ? (
        <>
          <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Publications</h2>
          <ol className="pl-4 list-decimal text-[7.5px]">
            {resume.publications.map((p, i) => (
              <li key={i} className="mb-0.5">{p.title}{p.venue ? ` — ${p.venue}` : ""}{p.date ? ` (${p.date})` : ""}</li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}
