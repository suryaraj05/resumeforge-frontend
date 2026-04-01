"use client";

import React, { useState, useCallback } from "react";
import { Button, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui";
import api from "@/lib/api";
import { LLM_KB_IMPORT_PROMPT } from "@/lib/kbImportPrompt";
import { KnowledgeBase } from "@/types/kb";

interface KBJsonImportPanelProps {
  onSuccess: (kb: KnowledgeBase) => void;
  disabled?: boolean;
  /** Wider layout on onboarding */
  defaultOpen?: boolean;
}

export function KBJsonImportPanel({ onSuccess, disabled, defaultOpen = false }: KBJsonImportPanelProps) {
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [jsonText, setJsonText] = useState("");
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState<"prompt" | null>(null);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(LLM_KB_IMPORT_PROMPT);
      setCopied("prompt");
      toast("Prompt copied — paste it into ChatGPT, Claude, etc.", "success");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast("Could not copy — select and copy manually from the box below.", "error");
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    const trimmed = jsonText.trim();
    if (!trimmed) {
      toast("Paste the JSON from your LLM first.", "error");
      return;
    }
    setImporting(true);
    try {
      const res = await api.post<{ kb: KnowledgeBase }>("/api/profile/kb/import", { json: trimmed });
      setJsonText("");
      setOpen(false);
      onSuccess(res.data.kb);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Import failed. Check that the JSON is a single object and matches the expected shape.";
      toast(message, "error");
    } finally {
      setImporting(false);
    }
  }, [jsonText, onSuccess, toast]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-paper">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-sage-light/30 transition-colors disabled:opacity-50"
      >
        <span>Import KB from JSON</span>
        <span className="text-ink-faint text-xs font-normal">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border/80">
          <ol className="text-xs text-ink-muted space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Click <strong className="text-ink">Copy prompt</strong> and paste it into any LLM (ChatGPT, Claude,
              etc.).
            </li>
            <li>
              In that chat, replace <code className="text-[10px] bg-border/40 px-1 rounded">[PASTE YOUR FULL RESUME HERE]</code> with
              your real resume text (or paste the resume right under the prompt).
            </li>
            <li>
              Copy <strong className="text-ink">only the JSON object</strong> from the reply. Strip markdown code
              fences if the model added them.
            </li>
            <li>Paste the JSON into the box below and click Import.</li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={copyPrompt} disabled={disabled}>
              {copied === "prompt" ? "Copied" : "Copy prompt"}
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Prompt preview (optional)</p>
            <textarea
              readOnly
              value={LLM_KB_IMPORT_PROMPT}
              className="w-full h-28 text-[10px] font-mono bg-paper border border-border rounded px-2 py-1.5 text-ink-muted resize-y leading-snug"
              spellCheck={false}
            />
          </div>

          <Textarea
            label="Pasted JSON"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{ "personal": { "name": "…" }, … }'
            className="min-h-[140px] font-mono text-xs resize-y"
            disabled={disabled || importing}
          />

          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => void handleImport()}
            disabled={disabled || importing || !jsonText.trim()}
            loading={importing}
          >
            Import into my profile
          </Button>
        </div>
      )}
    </div>
  );
}
