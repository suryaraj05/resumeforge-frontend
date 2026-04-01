"use client";

import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fadeIn">
      <div className="w-6 h-6 rounded-full bg-sage-light border border-sage/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sage text-[10px] font-bold">F</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-md bg-paper">
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-ink-faint inline-block"
      style={{
        animation: "typingBounce 1s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

// Inject the keyframe once globally via a style tag
if (typeof document !== "undefined") {
  const id = "__typing-bounce-kf";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes typingBounce {
        0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-4px); }
      }
    `;
    document.head.appendChild(style);
  }
}
