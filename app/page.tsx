import Link from "next/link";
import { Button } from "@/components/ui";

const VALUE_PROPS = [
  {
    icon: "◈",
    title: "One living document",
    body: "Upload your resume once. ResumeForge builds a structured knowledge base you can query, update, and refine through conversation.",
  },
  {
    icon: "◎",
    title: "Tailored in seconds",
    body: "Paste a job description into the chat. The AI reads your full history and generates a perfectly matched resume — never generic.",
  },
  {
    icon: "◐",
    title: "Collaborate with your cohort",
    body: "Share a group, compare experiences, and help each other polish applications — without sharing private documents.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper bg-grid-paper flex flex-col">
      {/* Nav */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-ink">
          Resume<span className="text-sage">Forge</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/auth?mode=signup">
            <Button variant="primary" size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-xs font-mono text-sage tracking-widest uppercase">
            Chat-first resume platform
          </p>
          <h1 className="text-5xl font-light text-ink leading-tight tracking-tight">
            Your resume,
            <br />
            <span className="font-semibold">always ready.</span>
          </h1>
          <p className="text-base text-ink-muted max-w-md mx-auto leading-relaxed">
            Upload your resume, maintain a living knowledge base, and generate
            job-tailored versions through a focused AI chat — in seconds.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/auth?mode=signup">
              <Button variant="primary" size="lg">Start for free</Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" size="lg">Sign in</Button>
            </Link>
          </div>
        </div>

        {/* Value props */}
        <div className="mt-24 w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px border border-border rounded overflow-hidden">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.title}
              className="bg-paper p-6 space-y-3 border-border [&:not(:last-child)]:border-r"
            >
              <span className="text-2xl text-sage">{prop.icon}</span>
              <h3 className="text-sm font-semibold text-ink">{prop.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{prop.body}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-4 flex items-center justify-between">
        <span className="text-xs text-ink-faint font-mono">ResumeForge · {new Date().getFullYear()}</span>
        <span className="text-xs text-ink-faint">Built for students, by builders.</span>
      </footer>
    </div>
  );
}
