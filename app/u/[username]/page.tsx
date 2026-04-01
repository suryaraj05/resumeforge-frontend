import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Badge } from "@/components/ui";

function serverApiBase(): string {
  const u =
    process.env.API_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:4000";
  return u.replace(/\/$/, "");
}

export type PublicProfilePayload = {
  username: string;
  displayName: string;
  headline: string;
  skills: string[];
  projects: {
    name?: string;
    techStack?: string[];
    link?: string;
    description?: string;
  }[];
  education: { institution?: string; degree?: string; field?: string }[];
  achievements: { title?: string; description?: string }[];
  showContact: boolean;
  contact?: { email?: string; linkedin?: string; github?: string };
};

async function fetchPublic(username: string): Promise<PublicProfilePayload | null> {
  const res = await fetch(
    `${serverApiBase()}/api/profile/public/${encodeURIComponent(username)}`,
    { next: { revalidate: 120 } }
  );
  if (!res.ok) return null;
  return res.json();
}

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await fetchPublic(params.username);
  if (!p) {
    return { title: "Profile | ResumeForge", robots: { index: false } };
  }
  const title = `${p.displayName} — ResumeForge`;
  const description = p.headline;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const p = await fetchPublic(params.username);
  if (!p) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center space-y-2 max-w-sm">
          <h1 className="text-lg font-semibold text-ink">Profile not found</h1>
          <p className="text-sm text-ink-muted">
            This profile is private or does not exist.
          </p>
          <Link href="/" className="text-sm text-sage hover:underline inline-block pt-2">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper bg-grid-paper">
      <header className="border-b border-border px-5 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Resume<span className="text-sage">Forge</span>
        </Link>
        <span className="text-[10px] font-mono text-ink-faint">@{p.username}</span>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar name={p.displayName} size="xl" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-ink">{p.displayName}</h1>
            <p className="text-sm text-ink-muted leading-relaxed">{p.headline}</p>
          </div>
        </div>

        {p.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <Badge key={s} variant="muted">
                  {s}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {p.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wide mb-3">
              Projects
            </h2>
            <ul className="space-y-3">
              {p.projects.map((proj, i) => (
                <li
                  key={i}
                  className="border border-border rounded-md px-3 py-2.5 bg-paper"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-ink text-sm">
                      {proj.name || "Project"}
                    </span>
                    {proj.link ? (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sage shrink-0 hover:underline"
                      >
                        Link
                      </a>
                    ) : null}
                  </div>
                  {proj.techStack?.length ? (
                    <p className="text-[11px] text-ink-faint mt-1 font-mono">
                      {proj.techStack.join(" · ")}
                    </p>
                  ) : null}
                  {proj.description ? (
                    <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                      {proj.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.education.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">
              Education
            </h2>
            <ul className="space-y-2 text-sm text-ink-muted">
              {p.education.map((e, i) => (
                <li key={i}>
                  <span className="text-ink font-medium">
                    {[e.degree, e.field].filter(Boolean).join(", ")}
                  </span>
                  {e.institution ? ` — ${e.institution}` : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.achievements.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">
              Achievements
            </h2>
            <ul className="space-y-2 text-sm">
              {p.achievements.map((a, i) => (
                <li key={i} className="text-ink-muted">
                  <span className="font-medium text-ink">{a.title}</span>
                  {a.description ? ` — ${a.description}` : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.showContact && p.contact && (
          <section className="border-t border-border pt-6">
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">
              Contact
            </h2>
            <ul className="text-sm text-ink-muted space-y-1">
              {p.contact.email ? <li>{p.contact.email}</li> : null}
              {p.contact.linkedin ? (
                <li>
                  <a href={p.contact.linkedin} className="text-sage hover:underline">
                    LinkedIn
                  </a>
                </li>
              ) : null}
              {p.contact.github ? (
                <li>
                  <a href={p.contact.github} className="text-sage hover:underline">
                    GitHub
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
