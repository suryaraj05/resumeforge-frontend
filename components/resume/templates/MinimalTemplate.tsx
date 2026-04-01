import React from "react";
import { RefinedResume } from "@/types/resume";

export function MinimalTemplate({ resume }: { resume: RefinedResume }) {
  return (
    <div className="text-[9px] leading-snug text-ink font-serif px-1">
      <h1 className="text-lg font-bold tracking-tight border-b border-ink pb-1 mb-2">
        {resume.targetRole || "Professional"}
      </h1>
      {resume.summary && <p className="text-[8.5px] mb-2 text-ink-muted">{resume.summary}</p>}
      {resume.experience?.length ? (
        <section className="mb-2">
          <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Experience</h2>
          {resume.experience.map((e, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between gap-2 border-b border-border/60 pb-px">
                <span className="font-semibold">{e.role} — {e.company}</span>
                <span className="font-mono text-[7.5px] text-ink-faint shrink-0">
                  {e.startDate} – {e.endDate || "Present"}
                </span>
              </div>
              <ul className="mt-0.5 space-y-0.5 pl-3 list-disc">
                {(e.description ?? []).slice(0, 6).map((d, j) => (
                  <li key={j} className="text-[8px] text-ink-muted">{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
      {resume.education?.length ? (
        <section className="mb-2">
          <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Education</h2>
          {resume.education.map((ed, i) => (
            <p key={i} className="font-mono text-[7.5px] text-ink-muted">
              {ed.degree} · {ed.institution} · {ed.startDate} – {ed.endDate}
            </p>
          ))}
        </section>
      ) : null}
      {resume.projects?.length ? (
        <section className="mb-2">
          <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Projects</h2>
          {resume.projects.map((p, i) => (
            <div key={i} className="mb-1">
              <strong className="text-[8.5px]">{p.name}</strong>
              {p.description && <p className="text-[8px] text-ink-muted">{p.description}</p>}
            </div>
          ))}
        </section>
      ) : null}
      <SkillsBlock skills={resume.skills} />
    </div>
  );
}

function SkillsBlock({ skills }: { skills?: RefinedResume["skills"] }) {
  if (!skills) return null;
  const parts: string[] = [];
  if (skills.technical?.length) parts.push(`Technical: ${skills.technical.join(", ")}`);
  if (skills.tools?.length) parts.push(`Tools: ${skills.tools.join(", ")}`);
  if (!parts.length) return null;
  return (
    <section>
      <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Skills</h2>
      <p className="text-[8px] text-ink-muted">{parts.join(" · ")}</p>
    </section>
  );
}
