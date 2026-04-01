import React from "react";
import { RefinedResume } from "@/types/resume";
import { asStringArray, displayText } from "@/lib/resumeArrays";

export function MinimalTemplate({ resume }: { resume: RefinedResume }) {
  return (
    <div className="text-[9px] leading-snug text-ink font-serif px-1">
      <h1 className="text-lg font-bold tracking-tight border-b border-ink pb-1 mb-2">
        {displayText(resume.targetRole) || "Professional"}
      </h1>
      {displayText(resume.summary) ? (
        <p className="text-[8.5px] mb-2 text-ink-muted">{displayText(resume.summary)}</p>
      ) : null}
      {resume.experience?.length ? (
        <section className="mb-2">
          <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Experience</h2>
          {resume.experience.map((e, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between gap-2 border-b border-border/60 pb-px">
                <span className="font-semibold">
                  {displayText(e.role)} — {displayText(e.company)}
                </span>
                <span className="font-mono text-[7.5px] text-ink-faint shrink-0">
                  {displayText(e.startDate)} – {displayText(e.endDate) || "Present"}
                </span>
              </div>
              {asStringArray(e.techStack).length ? (
                <p className="font-mono text-[7px] text-ink-faint mt-0.5">Stack: {asStringArray(e.techStack).join(", ")}</p>
              ) : null}
              <ul className="mt-0.5 space-y-0.5 pl-3 list-disc">
                {asStringArray(e.description).map((d, j) => (
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
              {displayText(ed.degree)} · {displayText(ed.institution)} · {displayText(ed.startDate)} –{" "}
              {displayText(ed.endDate)}
              {displayText(ed.field) ? ` · ${displayText(ed.field)}` : ""}
              {displayText(ed.cgpa) ? ` · CGPA ${displayText(ed.cgpa)}` : ""}
            </p>
          ))}
        </section>
      ) : null}
      {resume.achievements?.length ? (
        <section className="mb-2">
          <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Achievements</h2>
          {resume.achievements.map((a, i) => (
            <p key={i} className="text-[8px] text-ink-muted mb-0.5">
              <strong className="text-ink">{displayText(a.title)}</strong>
              {displayText(a.description) ? ` — ${displayText(a.description)}` : ""}
              {displayText(a.date) ? (
                <span className="font-mono text-ink-faint"> ({displayText(a.date)})</span>
              ) : null}
            </p>
          ))}
        </section>
      ) : null}
      {resume.projects?.length ? (
        <section className="mb-2">
          <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Projects</h2>
          {resume.projects.map((p, i) => (
            <div key={i} className="mb-1.5">
              <p className="text-[8.5px]">
                <strong>{displayText(p.name)}</strong>
                {displayText(p.date) ? (
                  <span className="font-mono text-[7.5px] text-ink-faint"> ({displayText(p.date)})</span>
                ) : null}
              </p>
              {asStringArray(p.techStack).length ? (
                <p className="font-mono text-[7px] text-ink-faint mt-0.5">{asStringArray(p.techStack).join(", ")}</p>
              ) : null}
              {displayText(p.description) ? (
                <p className="text-[8px] text-ink-muted mt-0.5">{displayText(p.description)}</p>
              ) : null}
              {asStringArray(p.highlights).length > 0 ? (
                <ul className="mt-0.5 pl-3 list-disc text-[8px] text-ink-muted">
                  {asStringArray(p.highlights).map((h, j) => (
                    <li key={j}>{h}</li>
                  ))}
                </ul>
              ) : null}
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
  const tech = asStringArray(skills.technical);
  const tools = asStringArray(skills.tools);
  const langs = asStringArray(skills.languages);
  const soft = asStringArray(skills.soft);
  if (tech.length) parts.push(`Technical: ${tech.join(", ")}`);
  if (tools.length) parts.push(`Tools: ${tools.join(", ")}`);
  if (langs.length) parts.push(`Languages: ${langs.join(", ")}`);
  if (soft.length) parts.push(`Soft: ${soft.join(", ")}`);
  if (!parts.length) return null;
  return (
    <section>
      <h2 className="text-[8px] uppercase tracking-[0.15em] border-b border-border mb-1">Skills</h2>
      <p className="text-[8px] text-ink-muted">{parts.join(" · ")}</p>
    </section>
  );
}
