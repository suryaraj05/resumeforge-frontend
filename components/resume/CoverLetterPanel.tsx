"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui";
import api from "@/lib/api";

interface CoverLetterPanelProps {
  text: string | null;
}

export function CoverLetterPanel({ text }: CoverLetterPanelProps) {
  const [open, setOpen] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const toast = useToast();

  async function copyText() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard", "success");
    } catch {
      toast("Copy failed", "error");
    }
  }

  async function downloadPdf() {
    if (!text || pdfLoading) return;
    setPdfLoading(true);
    toast(
      "Rendering cover letter PDF — often a few seconds. Please wait for the spinner to finish.",
      "info"
    );
    try {
      const res = await api.post(
        "/api/resume/cover-letter/pdf",
        { text },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cover-letter.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF saved — check your downloads folder.", "success");
    } catch {
      toast("PDF download failed. Try again in a moment.", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  if (!text) return null;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-sage-light/30 border-b border-border"
      >
        <span className="text-[10px] font-semibold text-ink uppercase tracking-wide">Cover letter</span>
        <span className="text-ink-faint text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="p-3 space-y-3">
          <div className="max-h-40 overflow-y-auto text-xs text-ink-muted leading-relaxed whitespace-pre-wrap font-serif border border-border rounded p-2 bg-paper">
            {text}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyText} disabled={pdfLoading}>
                Copy text
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={pdfLoading}
                onClick={downloadPdf}
                aria-busy={pdfLoading}
              >
                Download PDF
              </Button>
            </div>
            {pdfLoading ? (
              <p className="text-[9px] text-ink-muted">Don&apos;t click again until this finishes.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
