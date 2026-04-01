"use client";

import React, { useRef, useState } from "react";
import api from "@/lib/api";
import { KnowledgeBase } from "@/types/kb";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";

interface InlineUploadProps {
  onSuccess: (kb: KnowledgeBase) => void;
}

export function InlineUpload({ onSuccess }: InlineUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      toast("Only PDF files are accepted", "error");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await api.post<{ kb: KnowledgeBase }>("/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast("Resume uploaded and parsed!", "success");
      onSuccess(res.data.kb);
    } catch {
      toast("Failed to parse resume. Please try a cleaner PDF.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-2 border border-dashed border-border rounded-md p-4 flex flex-col items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {uploading ? (
        <div className="flex items-center gap-2">
          <Spinner size="sm" className="text-sage" />
          <span className="text-xs text-ink-muted">Uploading and parsing…</span>
        </div>
      ) : (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs font-medium text-sage hover:text-sage-dark transition-colors border border-sage/30 rounded px-3 py-1.5 hover:bg-sage-light"
          >
            Choose PDF to upload
          </button>
          <p className="text-[10px] text-ink-faint">PDF · max 5 MB</p>
        </>
      )}
    </div>
  );
}
