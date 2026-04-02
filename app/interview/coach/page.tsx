"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import api from "@/lib/api";
import type { InterviewQuestion } from "@/types/chat";
import { interviewQuestionTitle } from "@/components/chat/InterviewPrepCard";

type VoiceMode = "tt" | "tv" | "vt" | "vv";

/** Minimal STT surface (DOM `SpeechRecognition` is not in all TS lib targets). */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  onresult: ((ev: SpeechRecognitionResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: { 0?: { transcript: string } } };
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

function speak(text: string, voiceURI?: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voiceURI) {
    const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === voiceURI);
    if (v) u.voice = v;
  }
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export default function InterviewCoachPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<VoiceMode>("tt");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<"idle" | "speaking" | "listening">("idle");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

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
      setIdx(0);
      setAnswer("");
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

  const q = questions[idx];
  const title = useMemo(() => (q ? interviewQuestionTitle(q) : ""), [q]);

  const playQuestion = useCallback(() => {
    if (!title) return;
    const line = title + (q?.hint ? `. Hint: ${q.hint}` : "");
    if (mode === "tv" || mode === "vv") {
      setSessionPhase("speaking");
      speak(line, voiceURI || undefined, () => setSessionPhase("idle"));
    }
  }, [title, q?.hint, mode, voiceURI]);

  const startListen = useCallback(() => {
    const rec = getSpeechRecognition();
    if (!rec) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    setListening(true);
    setSessionPhase("listening");
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (ev: SpeechRecognitionResultEventLike) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        finalText = ev.results[i][0]?.transcript ?? finalText;
      }
    };
    rec.onend = () => {
      setListening(false);
      setSessionPhase("idle");
      setAnswer((prev) => (prev + (prev ? " " : "") + finalText).trim());
    };
    rec.onerror = () => {
      setListening(false);
      setSessionPhase("idle");
    };
    rec.start();
  }, []);

  const next = useCallback(() => {
    if (mode === "tv" || mode === "vv") {
      speak(`Saved. Next question.`, voiceURI || undefined);
    }
    if (idx + 1 >= questions.length) {
      setIdx(0);
      setAnswer("");
      return;
    }
    setIdx((i) => i + 1);
    setAnswer("");
  }, [idx, questions.length, mode, voiceURI]);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

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
        <div className="flex flex-wrap gap-2 items-center text-[10px]">
          <span className="text-ink-faint">Mode:</span>
          {(
            [
              ["tt", "Text → Text"],
              ["tv", "Text → Voice"],
              ["vt", "Voice → Text"],
              ["vv", "Voice → Voice"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={`px-2 py-1 rounded border ${
                mode === k ? "border-sage bg-sage-light text-sage-dark" : "border-border text-ink-muted"
              }`}
            >
              {label}
            </button>
          ))}
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

        {/* Subtle orb animation */}
        <div className="flex justify-center py-4">
          <div
            className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-sage/30 to-sage/5 border border-sage/20 ${
              reduceMotion ? "opacity-90" : sessionPhase !== "idle" ? "animate-pulse" : "opacity-80"
            }`}
            aria-hidden
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="text-sage" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !q ? (
          <p className="text-sm text-ink-muted">No questions loaded.</p>
        ) : (
          <div className="space-y-4 border border-border rounded-lg p-4 bg-paper">
            <p className="text-[10px] font-mono text-ink-faint">
              Question {idx + 1} / {questions.length}
              {q.type ? ` · ${q.type}` : ""}
            </p>
            <p className="text-base font-medium text-ink leading-snug">{title}</p>
            {q.hint ? <p className="text-xs text-ink-muted">{q.hint}</p> : null}
            {(mode === "tv" || mode === "vv") && (
              <Button variant="ghost" size="sm" type="button" onClick={() => playQuestion()}>
                Read aloud
              </Button>
            )}
            <label className="block text-[10px] font-mono uppercase text-ink-faint">Your answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-paper text-ink"
              placeholder={mode === "vt" || mode === "vv" ? "Speak or type your answer…" : "Type your answer…"}
            />
            {(mode === "vt" || mode === "vv") && (
              <Button
                variant={listening ? "ghost" : "primary"}
                size="sm"
                type="button"
                disabled={listening}
                onClick={() => startListen()}
              >
                {listening ? "Listening…" : "Speak answer"}
              </Button>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" size="sm" type="button" onClick={next}>
                Next question
              </Button>
              {q.answer ? (
                <details className="text-xs text-ink-muted flex-1 min-w-[200px]">
                  <summary className="cursor-pointer text-sage">Suggested answer (from prep)</summary>
                  <p className="mt-2 whitespace-pre-wrap">{q.answer}</p>
                </details>
              ) : null}
            </div>
            <div className="pt-2 border-t border-border">
              <label className="text-[10px] font-mono text-ink-faint block mb-1">TTS voice (browser)</label>
              <select
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                className="text-xs border border-border rounded px-2 py-1 w-full max-w-md bg-paper"
              >
                <option value="">Default</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
