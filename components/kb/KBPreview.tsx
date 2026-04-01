import React from "react";
import { KnowledgeBase } from "@/types/kb";
import { Badge } from "@/components/ui";
import { KBSection } from "./KBSection";

interface KBPreviewProps {
  kb: KnowledgeBase;
  activeSection?: string;
}

export function KBPreview({ kb, activeSection }: KBPreviewProps) {
  const allSkills = [
    ...(kb.skills?.technical ?? []),
    ...(kb.skills?.tools ?? []),
    ...(kb.skills?.languages ?? []),
  ];

  return (
    <div className="border border-border rounded overflow-hidden">
      {/* Personal Info */}
      <KBSection
        title="Personal Info"
        defaultOpen={activeSection === 'personal' || activeSection == null}
        empty={!kb.personal || Object.keys(kb.personal).length === 0}
      >
        {kb.personal && (
          <div className="space-y-1.5">
            {kb.personal.name && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-ink-muted w-24 shrink-0">Name</span>
                <span className="text-xs text-ink text-right">{kb.personal.name}</span>
              </div>
            )}
            {kb.personal.email && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-ink-muted w-24 shrink-0">Email</span>
                <span className="text-xs text-ink text-right">{kb.personal.email}</span>
              </div>
            )}
            {kb.personal.phone && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-ink-muted w-24 shrink-0">Phone</span>
                <span className="text-xs text-ink text-right">{kb.personal.phone}</span>
              </div>
            )}
            {kb.personal.location && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-ink-muted w-24 shrink-0">Location</span>
                <span className="text-xs text-ink text-right">{kb.personal.location}</span>
              </div>
            )}
            {kb.personal.linkedin && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-ink-muted w-24 shrink-0">LinkedIn</span>
                <span className="text-xs text-sage truncate text-right max-w-[200px]">{kb.personal.linkedin}</span>
              </div>
            )}
            {kb.personal.github && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-ink-muted w-24 shrink-0">GitHub</span>
                <span className="text-xs text-sage truncate text-right max-w-[200px]">{kb.personal.github}</span>
              </div>
            )}
            {kb.personal.summary && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-ink-muted leading-relaxed">{kb.personal.summary}</p>
              </div>
            )}
          </div>
        )}
      </KBSection>

      {/* Education */}
      <KBSection
        title="Education"
        defaultOpen={activeSection === 'education'}
        count={kb.education?.length}
        empty={!kb.education?.length}
      >
        <div className="space-y-3">
          {kb.education?.map((edu) => (
            <div key={edu.id} className="space-y-0.5">
              <p className="text-xs font-semibold text-ink">
                {edu.degree}{edu.field ? ` · ${edu.field}` : ""}
              </p>
              <p className="text-xs text-ink-muted">{edu.institution}</p>
              {(edu.startDate || edu.endDate) && (
                <p className="text-[10px] font-mono text-ink-faint">
                  {[edu.startDate, edu.endDate].filter(Boolean).join(" → ")}
                </p>
              )}
              {edu.cgpa && (
                <p className="text-[10px] text-ink-muted">GPA: {edu.cgpa}</p>
              )}
              {edu.achievements?.length ? (
                <ul className="mt-1 space-y-0.5 pl-2">
                  {edu.achievements.map((a, i) => (
                    <li key={i} className="ink-dot text-xs text-ink-muted">{a}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </KBSection>

      {/* Experience */}
      <KBSection
        title="Experience"
        defaultOpen={activeSection === 'experience'}
        count={kb.experience?.length}
        empty={!kb.experience?.length}
      >
        <div className="space-y-4">
          {kb.experience?.map((exp) => (
            <div key={exp.id} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink">{exp.role}</p>
                  <p className="text-xs text-ink-muted">{exp.company}</p>
                </div>
                <div className="text-right shrink-0">
                  {exp.type && (
                    <Badge variant="muted" className="text-[10px]">{exp.type}</Badge>
                  )}
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-[10px] font-mono text-ink-faint mt-1">
                      {[exp.startDate, exp.endDate].filter(Boolean).join(" → ")}
                    </p>
                  )}
                </div>
              </div>
              {exp.description?.length ? (
                <ul className="space-y-0.5 pl-2">
                  {exp.description.slice(0, 3).map((d, i) => (
                    <li key={i} className="ink-dot text-xs text-ink-muted leading-relaxed">{d}</li>
                  ))}
                  {exp.description.length > 3 && (
                    <li className="text-[10px] text-ink-faint pl-4">+{exp.description.length - 3} more</li>
                  )}
                </ul>
              ) : null}
              {exp.techStack?.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {exp.techStack.map((t) => (
                    <Badge key={t} variant="sage" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </KBSection>

      {/* Projects */}
      <KBSection
        title="Projects"
        defaultOpen={activeSection === 'projects'}
        count={kb.projects?.length}
        empty={!kb.projects?.length}
      >
        <div className="space-y-4">
          {kb.projects?.map((proj) => (
            <div key={proj.id} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-ink">{proj.name}</p>
                {proj.date && (
                  <span className="text-[10px] font-mono text-ink-faint shrink-0">{proj.date}</span>
                )}
              </div>
              {proj.description && (
                <p className="text-xs text-ink-muted leading-relaxed">{proj.description}</p>
              )}
              {proj.highlights?.length ? (
                <ul className="space-y-0.5 pl-2">
                  {proj.highlights.slice(0, 2).map((h, i) => (
                    <li key={i} className="ink-dot text-xs text-ink-muted">{h}</li>
                  ))}
                </ul>
              ) : null}
              {proj.techStack?.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.techStack.map((t) => (
                    <Badge key={t} variant="sage" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </KBSection>

      {/* Skills */}
      <KBSection
        title="Skills"
        defaultOpen={activeSection === 'skills'}
        count={allSkills.length || undefined}
        empty={!allSkills.length && !kb.skills?.soft?.length}
      >
        <div className="space-y-2.5">
          {kb.skills?.technical?.length ? (
            <div>
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-1.5">Technical</p>
              <div className="flex flex-wrap gap-1">
                {kb.skills.technical.map((s) => (
                  <Badge key={s} variant="sage">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {kb.skills?.tools?.length ? (
            <div>
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-1.5">Tools</p>
              <div className="flex flex-wrap gap-1">
                {kb.skills.tools.map((s) => (
                  <Badge key={s} variant="default">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {kb.skills?.languages?.length ? (
            <div>
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1">
                {kb.skills.languages.map((s) => (
                  <Badge key={s} variant="muted">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {kb.skills?.soft?.length ? (
            <div>
              <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-1.5">Soft Skills</p>
              <div className="flex flex-wrap gap-1">
                {kb.skills.soft.map((s) => (
                  <Badge key={s} variant="muted">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </KBSection>

      {/* Certifications */}
      {(kb.certifications?.length ?? 0) > 0 && (
        <KBSection title="Certifications" defaultOpen={activeSection === 'certifications'} count={kb.certifications?.length}>
          <div className="space-y-2">
            {kb.certifications?.map((c) => (
              <div key={c.id} className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-ink">{c.name}</p>
                  {c.issuer && <p className="text-[10px] text-ink-muted">{c.issuer}</p>}
                </div>
                {c.date && <span className="text-[10px] font-mono text-ink-faint shrink-0">{c.date}</span>}
              </div>
            ))}
          </div>
        </KBSection>
      )}

      {/* Achievements */}
      {(kb.achievements?.length ?? 0) > 0 && (
        <KBSection title="Achievements" defaultOpen={activeSection === 'achievements'} count={kb.achievements?.length}>
          <div className="space-y-2">
            {kb.achievements?.map((a) => (
              <div key={a.id}>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-medium text-ink">{a.title}</p>
                  {a.date && <span className="text-[10px] font-mono text-ink-faint shrink-0">{a.date}</span>}
                </div>
                {a.description && <p className="text-xs text-ink-muted mt-0.5">{a.description}</p>}
              </div>
            ))}
          </div>
        </KBSection>
      )}

      {/* Publications */}
      {(kb.publications?.length ?? 0) > 0 && (
        <KBSection title="Publications" count={kb.publications?.length}>
          <div className="space-y-2">
            {kb.publications?.map((p) => (
              <div key={p.id}>
                <p className="text-xs font-medium text-ink">{p.title}</p>
                {p.venue && <p className="text-[10px] text-ink-muted">{p.venue}</p>}
                {p.date && <p className="text-[10px] font-mono text-ink-faint">{p.date}</p>}
              </div>
            ))}
          </div>
        </KBSection>
      )}
    </div>
  );
}
