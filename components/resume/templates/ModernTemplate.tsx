import React from "react";
import { RefinedResume } from "@/types/resume";
import { asStringArray, displayText } from "@/lib/resumeArrays";

export function ModernTemplate({ resume }: { resume: RefinedResume }) {
  return (
    <div className="flex gap-2 text-[8px] leading-snug font-serif min-h-[280px]">
      <aside className="w-[30%] shrink-0 bg-sage-light border border-sage/20 rounded-sm p-2">
        <h2 className="text-[7px] uppercase tracking-widest text-sage-dark border-b border-sage/30 pb-0.5 mb-1">Education</h2>
        {(resume.education ?? []).map((e, i) => (
          <div key={i} className="mb-1.5">
            <p className="font-semibold text-[8px]">{displayText(e.institution)}</p>
            <p className="font-mono text-[7px] text-ink-muted">
              {displayText(e.degree)}
              {displayText(e.field) ? `, ${displayText(e.field)}` : ""}
              {displayText(e.cgpa) ? ` · CGPA ${displayText(e.cgpa)}` : ""}
            </p>
          </div>
        ))}
        <h2 className="text-[7px] uppercase tracking-widest text-sage-dark border-b border-sage/30 pb-0.5 mb-1 mt-2">Skills</h2>
        <div className="text-[7.5px] text-ink-muted space-y-0.5">
          {asStringArray(resume.skills?.technical).length ? (
            <p><strong className="text-ink">Tech:</strong> {asStringArray(resume.skills?.technical).join(", ")}</p>
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
        {resume.certifications?.length ? (
          <>
            <h2 className="text-[7px] uppercase tracking-widest text-sage-dark border-b border-sage/30 pb-0.5 mb-1 mt-2">Certs</h2>
            {resume.certifications.map((c, i) => (
              <p key={i} className="text-[7px]">
                {displayText(c.name)}
                {displayText(c.issuer) ? ` · ${displayText(c.issuer)}` : ""}
              </p>
            ))}
          </>
        ) : null}
      </aside>
      <div className="flex-1 min-w-0 py-0.5">
        <h1 className="text-base font-bold text-ink">{displayText(resume.targetRole) || "Candidate"}</h1>
        {displayText(resume.summary) ? (
          <p className="text-[8px] text-ink-muted mt-1 mb-2">{displayText(resume.summary)}</p>
        ) : null}
        <h2 className="text-[7px] uppercase tracking-widest text-sage border-b border-sage/40 pb-0.5 mb-1">Experience</h2>
        {(resume.experience ?? []).map((e, i) => (
          <div key={i} className="mb-1.5">
            <p className="font-bold text-[8.5px]">{displayText(e.role)}</p>
            <p className="font-mono text-[7px] text-ink-faint">
              {displayText(e.company)} · {displayText(e.startDate)} – {displayText(e.endDate) || "Present"}
            </p>
            {asStringArray(e.techStack).length ? (
              <p className="font-mono text-[7px] text-ink-faint mt-0.5">Stack: {asStringArray(e.techStack).join(", ")}</p>
            ) : null}
            <ul className="mt-0.5 pl-3 list-disc text-[7.5px] text-ink-muted">
              {asStringArray(e.description).map((d, j) => (
                <li key={j}>{d}</li>
              ))}
            </ul>
          </div>
        ))}
        {resume.achievements?.length ? (
          <>
            <h2 className="text-[7px] uppercase tracking-widest text-sage border-b border-sage/40 pb-0.5 mb-1 mt-2">Achievements</h2>
            {resume.achievements.map((a, i) => (
              <div key={i} className="mb-1 text-[7.5px] text-ink-muted">
                <strong className="text-ink">{displayText(a.title)}</strong>
                {displayText(a.description) ? ` — ${displayText(a.description)}` : ""}
                {displayText(a.date) ? (
                  <span className="font-mono text-ink-faint"> ({displayText(a.date)})</span>
                ) : null}
              </div>
            ))}
          </>
        ) : null}
        {resume.projects?.length ? (
          <>
            <h2 className="text-[7px] uppercase tracking-widest text-sage border-b border-sage/40 pb-0.5 mb-1 mt-2">Projects</h2>
            {resume.projects.map((p, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                  <strong className="text-[8px]">{displayText(p.name)}</strong>
                  {displayText(p.date) ? (
                    <span className="font-mono text-[7px] text-ink-faint">{displayText(p.date)}</span>
                  ) : null}
                </div>
                {asStringArray(p.techStack).length ? (
                  <p className="font-mono text-[7px] text-ink-faint mt-0.5">Stack: {asStringArray(p.techStack).join(", ")}</p>
                ) : null}
                {displayText(p.description) ? (
                  <p className="text-[7.5px] text-ink-muted mt-0.5">{displayText(p.description)}</p>
                ) : null}
                {asStringArray(p.highlights).length > 0 ? (
                  <ul className="mt-0.5 pl-3 list-disc text-[7.5px] text-ink-muted">
                    {asStringArray(p.highlights).map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
