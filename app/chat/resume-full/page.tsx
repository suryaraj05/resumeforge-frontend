"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";
import api from "@/lib/api";
import type { RefinedResume, ResumeTemplateId } from "@/types/resume";
import { MinimalTemplate } from "@/components/resume/templates/MinimalTemplate";
import { ModernTemplate } from "@/components/resume/templates/ModernTemplate";
import { AcademicTemplate } from "@/components/resume/templates/AcademicTemplate";

function validTemplate(t: string | null): ResumeTemplateId {
  if (t === "modern" || t === "academic" || t === "minimal") return t;
  return "minimal";
}

function ResumeFullPreviewPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resume, setResume] = useState<RefinedResume | null>(null);
  const [fetching, setFetching] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const template = useMemo(() => {
    const q = searchParams.get("template");
    if (q) return validTemplate(q);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("rf_resume_full_template");
        if (stored) return validTemplate(stored);
      } catch {
        /* ignore */
      }
    }
    return "minimal";
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setErr(null);
      try {
        const res = await api.get<{ latestResume?: RefinedResume }>("/api/resume/session");
        if (cancelled) return;
        setResume(res.data.latestResume ?? null);
      } catch {
        if (!cancelled) setErr("Could not load resume session.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner className="text-sage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between gap-3 bg-paper sticky top-0 z-10">
        <Link href="/chat" className="text-sm text-sage hover:underline">
          Back to chat
        </Link>
        <h1 className="text-sm font-semibold">Full resume preview — {template}</h1>
        <button
          type="button"
          className="text-xs text-ink-muted hover:text-ink"
          onClick={() => window.print()}
        >
          Print
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 print:py-2 print:max-w-none">
        {fetching ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-sage" />
          </div>
        ) : err ? (
          <p className="text-sm text-red-600">{err}</p>
        ) : !resume ? (
          <p className="text-sm text-ink-muted">
            No tailored resume in session yet. Generate one from chat, then open Full preview again.
          </p>
        ) : (
          <div className="border border-border rounded-lg bg-white shadow-sm overflow-hidden print:shadow-none print:border-0">
            <div className="p-6 md:p-10 bg-paper print:p-4">
              {template === "minimal" && <MinimalTemplate resume={resume} />}
              {template === "modern" && <ModernTemplate resume={resume} />}
              {template === "academic" && <AcademicTemplate resume={resume} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResumeFullPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <Spinner className="text-sage" />
        </div>
      }
    >
      <ResumeFullPreviewPageInner />
    </Suspense>
  );
}
