import React from "react";
import { RefinedResume } from "@/types/resume";
import { asStringArray, displayText } from "@/lib/resumeArrays";

export function AcademicTemplate({ resume }: { resume: RefinedResume }) {
  return (
    <div className="text-[8px] leading-snug font-serif text-ink px-1">
      <h1 className="text-center text-[11px] font-bold uppercase tracking-[0.12em]">
        {displayText(resume.targetRole) || "Curriculum Vitae"}
      </h1>
      <p className="text-center font-mono text-[7px] text-ink-faint mb-2">Summary</p>
      {displayText(resume.summary) ? (
        <p className="text-justify text-[8px] text-ink-muted mb-2">{displayText(resume.summary)}</p>
      ) : null}
      <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Education</h2>
      {(resume.education ?? []).map((e, i) => (
        <p key={i} className="mb-0.5">
          {displayText(e.degree)}
          {displayText(e.field) ? ` in ${displayText(e.field)}` : ""}, {displayText(e.institution)},{" "}
          {displayText(e.startDate)}–{displayText(e.endDate)}
          {displayText(e.cgpa) ? ` · CGPA ${displayText(e.cgpa)}` : ""}
        </p>
      ))}
      <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Experience</h2>
      {(resume.experience ?? []).map((e, i) => (
        <div key={i} className="mb-1.5">
          <p>
            <strong>{displayText(e.role)}</strong>, {displayText(e.company)}{" "}
            <span className="font-mono text-ink-faint">
              ({displayText(e.startDate)}–{displayText(e.endDate)})
            </span>
          </p>
          {asStringArray(e.techStack).length ? (
            <p className="font-mono text-[7px] text-ink-faint mt-0.5">Stack: {asStringArray(e.techStack).join(", ")}</p>
          ) : null}
          <ul className="pl-3 list-disc text-[7.5px] text-ink-muted">
            {asStringArray(e.description).map((d, j) => (
              <li key={j}>{d}</li>
            ))}
          </ul>
        </div>
      ))}
      {resume.achievements?.length ? (
        <>
          <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Achievements</h2>
          {resume.achievements.map((a, i) => (
            <p key={i} className="text-[7.5px] mb-0.5 text-ink-muted">
              <strong className="text-ink">{displayText(a.title)}</strong>
              {displayText(a.description) ? ` — ${displayText(a.description)}` : ""}
              {displayText(a.date) ? (
                <span className="font-mono text-ink-faint"> ({displayText(a.date)})</span>
              ) : null}
            </p>
          ))}
        </>
      ) : null}
      {resume.projects?.length ? (
        <>
          <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Projects</h2>
          <div className="space-y-1.5">
            {resume.projects.map((p, i) => (
              <div key={i} className="pl-3 border-l border-border/60">
                <p className="text-[7.5px]">
                  <strong>{displayText(p.name)}</strong>
                  {displayText(p.date) ? (
                    <span className="font-mono text-ink-faint"> {displayText(p.date)}</span>
                  ) : null}
                </p>
                {asStringArray(p.techStack).length ? (
                  <p className="font-mono text-[7px] text-ink-faint mt-0.5">Stack: {asStringArray(p.techStack).join(", ")}</p>
                ) : null}
                {displayText(p.description) ? (
                  <p className="text-[7.5px] text-ink-muted mt-0.5">{displayText(p.description)}</p>
                ) : null}
                {asStringArray(p.highlights).length > 0 ? (
                  <ul className="pl-3 list-disc text-[7.5px] text-ink-muted mt-0.5">
                    {asStringArray(p.highlights).map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
      {(asStringArray(resume.skills?.technical).length ||
        asStringArray(resume.skills?.tools).length ||
        asStringArray(resume.skills?.languages).length ||
        asStringArray(resume.skills?.soft).length) ? (
        <>
          <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Technical skills</h2>
          <div className="text-[7.5px] text-ink-muted space-y-0.5">
            {asStringArray(resume.skills?.technical).length ? (
              <p><strong className="text-ink">Technical:</strong> {asStringArray(resume.skills?.technical).join(", ")}</p>
            ) : null}
            {asStringArray(resume.skills?.tools).length ? (
              <p><strong className="text-ink">Tools:</strong> {asStringArray(resume.skills?.tools).join(", ")}</p>
            ) : null}
            {asStringArray(resume.skills?.languages).length ? (
              <p><strong className="text-ink">Languages:</strong> {asStringArray(resume.skills?.languages).join(", ")}</p>
            ) : null}
            {asStringArray(resume.skills?.soft).length ? (
              <p><strong className="text-ink">Soft:</strong> {asStringArray(resume.skills?.soft).join(", ")}</p>
            ) : null}
          </div>
        </>
      ) : null}
      {resume.publications?.length ? (
        <>
          <h2 className="text-[8px] font-bold uppercase border-b border-ink mb-1 mt-2">Publications</h2>
          <ol className="pl-4 list-decimal text-[7.5px]">
            {resume.publications.map((p, i) => (
              <li key={i} className="mb-0.5">
                {displayText(p.title)}
                {displayText(p.venue) ? ` — ${displayText(p.venue)}` : ""}
                {displayText(p.date) ? ` (${displayText(p.date)})` : ""}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}
