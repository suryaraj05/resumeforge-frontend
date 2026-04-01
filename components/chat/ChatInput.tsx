"use client";

import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

const INITIAL_CHIPS = [
  "Upload my resume",
  "Generate resume for a job",
  "How well do I fit this role?",
  "Roast my resume",
  "Interview prep",
  "Share my profile",
];

// Loading state messages contextual to the active operation
const LOADING_HINTS = [
  "Thinking about your profile…",
  "Processing your request…",
  "Working on it…",
];
let _hintIdx = 0;
function nextHint() {
  return LOADING_HINTS[_hintIdx++ % LOADING_HINTS.length];
}

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  hasMessages: boolean;
  loadingHint?: string;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput({ onSend, disabled, hasMessages, loadingHint }, ref) {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus() {
        textareaRef.current?.focus();
      },
    }));

    const autoResize = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 5 * 24) + "px";
    }, []);

    const handleSend = useCallback(() => {
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }, [text, disabled, onSend]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [handleSend]
    );

    const hint = loadingHint || nextHint();

    return (
      <div className="border-t border-border p-4 shrink-0 bg-paper">
        {/* Suggested chips — only before first message */}
        {!hasMessages && (
          <div className="flex flex-wrap gap-2 mb-3">
            {INITIAL_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => onSend(chip)}
                disabled={disabled}
                className="text-xs px-3 py-1.5 border border-border rounded-full text-ink-muted hover:border-sage/50 hover:bg-sage-light hover:text-sage-dark transition-colors disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Text area */}
          <div
            className={cn(
              "flex-1 flex items-end border rounded px-3 py-2 bg-paper transition-colors",
              disabled ? "border-border opacity-60" : "border-border focus-within:border-sage"
            )}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => { setText(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? hint : "Ask ResumeForge anything… (? for help)"}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-ink placeholder:text-ink-faint leading-6 max-h-[120px] overflow-y-auto"
              style={{ height: "24px" }}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className={cn(
              "w-9 h-9 rounded flex items-center justify-center shrink-0 transition-colors",
              text.trim() && !disabled
                ? "bg-sage text-white hover:bg-sage-dark"
                : "bg-border/40 text-ink-faint cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <p className="text-[10px] text-ink-faint mt-1.5 font-mono">
          Enter to send · Shift+Enter for newline · Ctrl+K to focus
        </p>
      </div>
    );
  }
);
