"use client";

import React, { useState } from "react";
import { InterviewQuestion } from "@/types/chat";
import { cn } from "@/lib/utils";

interface InterviewPrepCardProps {
  questions: InterviewQuestion[];
}

export function InterviewPrepCard({ questions }: InterviewPrepCardProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-sage-light/30 border-b border-border">
        <p className="text-[10px] font-mono text-sage uppercase tracking-wide">Interview Prep</p>
        <p className="text-xs font-medium text-ink">{questions.length} likely questions for your profile</p>
      </div>
      <div className="divide-y divide-border">
        {questions.map((q, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-sage-light/20 transition-colors"
            >
              <span className="text-[10px] font-mono text-ink-faint mt-0.5 shrink-0 w-4">{i + 1}.</span>
              <p className="flex-1 text-xs text-ink font-medium">{q.q}</p>
              <span className={cn("text-ink-faint text-[10px] shrink-0 transition-transform", openIndex === i && "rotate-180")}>
                ▼
              </span>
            </button>
            {openIndex === i && (
              <div className="px-3 pb-3 pt-1 ml-7 animate-fadeIn">
                <p className="text-[10px] font-mono text-sage uppercase tracking-wide mb-1">Answer hint</p>
                <p className="text-xs text-ink-muted leading-relaxed">{q.hint}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
