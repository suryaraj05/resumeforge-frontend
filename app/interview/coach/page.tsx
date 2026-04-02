"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import api from "@/lib/api";
import type { InterviewQuestion } from "@/types/chat";
import { InterviewCoachPractice } from "@/components/chat/InterviewCoachPractice";

export default function InterviewCoachPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  const loadPrep = useCallback(async (which: "general" | "role") => {
    setLoading(true);
    setError(null);
    try {
      if (which === "general") {
        const res = await api.post<{ questions: InterviewQuestion[] }>("/api/chat/interview-prep", {
          mode: "general",
        });
        setQuestions(res.data.questions ?? []);
      } else {
        const sess = await api.get<{ jd?: string }>("/api/resume/session");
        const jd = typeof sess.data?.jd === "string" ? sess.data.jd.trim() : "";
        if (jd.length < 80) {
          setError("Need a job description in session (80+ chars). Generate a resume from a JD in chat first.");
          setQuestions([]);
          return;
        }
        const res = await api.post<{ questions: InterviewQuestion[] }>("/api/chat/interview-prep", {
          mode: "role",
          jd,
        });
        setQuestions(res.data.questions ?? []);
      }
    } catch {
      setError("Could not load questions. Try again.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadPrep("general");
  }, [user, loadPrep]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner className="text-sage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="border-b border-border px-4 py-3 flex flex-wrap items-center gap-3 justify-between bg-paper sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-xs text-sage hover:underline">
            Back to chat
          </Link>
          <h1 className="text-sm font-semibold">Interview coach</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => void loadPrep("general")}>
            General prep
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void loadPrep("role")}>
            Role prep (needs JD)
          </Button>
        </div>

        <InterviewCoachPractice questions={questions} loading={loading} error={error} />
      </main>
    </div>
  );
}
