"use client";

import React, { useState } from "react";
import { InterviewQuestion } from "@/types/chat";
import { cn } from "@/lib/utils";

/** Resolve question text from chat (`q`) or REST API (`question`) shape. */
export function interviewQuestionTitle(q: InterviewQuestion): string {
  return (q.q || q.question || "").trim() || "Question";
}

interface InterviewPrepCardProps {
  questions: InterviewQuestion[];
  /** When false, only the accordion list (for embedding in Interview Prep panel sections). */
  showHeader?: boolean;
  /** Overrides default subtitle under "Interview Prep". */
  subtitle?: string;
}

export function InterviewPrepCard({
  questions,
  showHeader = true,
  subtitle,
}: InterviewPrepCardProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("border border-border rounded-md overflow-hidden", showHeader ? "mt-2" : "")}>
      {showHeader ? (
        <div className="px-3 py-2 bg-sage-light/30 border-b border-border">
          <p className="text-[10px] font-mono text-sage uppercase tracking-wide">Interview Prep</p>
          <p className="text-xs font-medium text-ink">
            {subtitle ?? `${questions.length} likely questions for your profile`}
          </p>
        </div>
      ) : null}
      <div className="divide-y divide-border">
        {questions.map((q, i) => {
          const title = interviewQuestionTitle(q);
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-sage-light/20 transition-colors"
              >
                <span className="text-[10px] font-mono text-ink-faint mt-0.5 shrink-0 w-4">{i + 1}.</span>
                <div className="flex-1 min-w-0 space-y-1">
                  {q.type ? (
                    <span className="inline-block text-[9px] font-mono uppercase tracking-wide text-sage px-1.5 py-0.5 rounded border border-sage/30 bg-sage-light/40">
                      {q.type}
                    </span>
                  ) : null}
                  <p className="text-xs text-ink font-medium leading-snug">{title}</p>
                </div>
                <span
                  className={cn(
                    "text-ink-faint text-[10px] shrink-0 transition-transform",
                    openIndex === i && "rotate-180"
                  )}
                >
                  ▼
                </span>
              </button>
              {openIndex === i && (
                <div className="px-3 pb-3 pt-1 ml-7 animate-fadeIn space-y-3">
                  {q.answer ? (
                    <div>
                      <p className="text-[10px] font-mono text-sage uppercase tracking-wide mb-1">
                        Suggested answer
                      </p>
                      <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[10px] font-mono text-sage uppercase tracking-wide mb-1">Hint</p>
                    <p className="text-xs text-ink-muted leading-relaxed">{q.hint || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
