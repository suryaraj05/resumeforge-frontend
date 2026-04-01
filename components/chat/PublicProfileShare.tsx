"use client";

import React, { useState } from "react";

export function PublicProfileShare({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-2 max-w-[90%] rounded-md border border-border bg-paper px-3 py-2.5 text-xs">
      <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wide mb-1.5">
        Public profile
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-[11px] font-mono text-ink break-all flex-1 min-w-0">{url}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-xs font-medium text-sage border border-sage/40 rounded px-2 py-1 hover:bg-sage-light"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
