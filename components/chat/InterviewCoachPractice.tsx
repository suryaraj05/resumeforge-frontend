"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui";
import type { InterviewQuestion } from "@/types/chat";
import { interviewQuestionTitle } from "./InterviewPrepCard";
import {
  getSpeechRecognition,
  speak,
  type SpeechRecognitionResultEventLike,
  type VoiceMode,
} from "@/lib/interviewCoachSpeech";

export type InterviewCoachPracticeProps = {
  questions: InterviewQuestion[];
  /** While parent is fetching (optional) */
  loading?: boolean;
  error?: string | null;
  /** Narrower layout + smaller orb for sidebar */
  compact?: boolean;
  /** e.g. "Role" / "General" — shown above mode buttons */
  label?: string;
  className?: string;
};

export function InterviewCoachPractice({
  questions,
  loading = false,
  error = null,
  compact = false,
  label,
  className = "",
}: InterviewCoachPracticeProps) {
  const [mode, setMode] = useState<VoiceMode>("tt");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<"idle" | "speaking" | "listening">("idle");

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    setIdx(0);
    setAnswer("");
  }, [questions]);

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
    if (!rec) return;
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
      speak("Next question.", voiceURI || undefined);
    }
    if (questions.length === 0) return;
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

  const orbDim = compact ? "w-16 h-16" : "w-24 h-24";
  const orbPy = compact ? "py-1" : "py-2";
  const sttSupported = typeof window !== "undefined" && Boolean(getSpeechRecognition());

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label ? (
        <p className="text-[10px] font-semibold text-sage uppercase tracking-wide">{label}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5 items-center text-[10px]">
        <span className="text-ink-faint shrink-0">Mode:</span>
        {(
          [
            ["tt", "Text → Text"],
            ["tv", "Text → Voice"],
            ["vt", "Voice → Text"],
            ["vv", "Voice → Voice"],
          ] as const
        ).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => setMode(k)}
            className={`px-2 py-0.5 rounded border ${
              mode === k ? "border-sage bg-sage-light text-sage-dark" : "border-border text-ink-muted"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className={`flex justify-center ${orbPy}`}>
        <div
          className={`relative ${orbDim} rounded-full bg-gradient-to-br from-sage/30 to-sage/5 border border-sage/20 ${
            reduceMotion ? "opacity-90" : sessionPhase !== "idle" ? "animate-pulse" : "opacity-80"
          }`}
          aria-hidden
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="text-sage" />
        </div>
      ) : error ? (
        <p className="text-[11px] text-red-600">{error}</p>
      ) : !q ? (
        <p className="text-[11px] text-ink-muted">Generate or load questions above, then practice here.</p>
      ) : (
        <div className={`space-y-3 border border-border rounded-lg bg-paper ${compact ? "p-3" : "p-4"}`}>
          <p className="text-[10px] font-mono text-ink-faint">
            Question {idx + 1} / {questions.length}
            {q.type ? ` · ${q.type}` : ""}
          </p>
          <p className={`font-medium text-ink leading-snug ${compact ? "text-sm" : "text-base"}`}>{title}</p>
          {q.hint ? <p className="text-[11px] text-ink-muted">{q.hint}</p> : null}
          {(mode === "tv" || mode === "vv") && (
            <Button variant="ghost" size="sm" type="button" onClick={() => playQuestion()}>
              Read aloud
            </Button>
          )}
          <label className="block text-[10px] font-mono uppercase text-ink-faint">Your answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={compact ? 4 : 5}
            className="w-full text-sm border border-border rounded-md px-2.5 py-2 bg-paper text-ink"
            placeholder={mode === "vt" || mode === "vv" ? "Speak or type your answer…" : "Type your answer…"}
          />
          {(mode === "vt" || mode === "vv") && (
            <div className="space-y-1">
              <Button
                variant={listening ? "ghost" : "primary"}
                size="sm"
                type="button"
                disabled={listening || !sttSupported}
                onClick={() => startListen()}
              >
                {listening ? "Listening…" : sttSupported ? "Speak answer" : "STT not supported"}
              </Button>
              {!sttSupported ? (
                <p className="text-[10px] text-ink-muted">Try Chrome/Edge for voice input; Safari support varies.</p>
              ) : null}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="primary" size="sm" type="button" onClick={next}>
              Next question
            </Button>
            {q.answer ? (
              <details className="text-[11px] text-ink-muted flex-1 min-w-[160px]">
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
              className="text-[11px] border border-border rounded px-2 py-1 w-full max-w-md bg-paper"
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
    </div>
  );
}
