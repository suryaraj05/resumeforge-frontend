"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { KBPreview } from "@/components/kb/KBPreview";
import { KBJsonImportPanel } from "@/components/kb/KBJsonImportPanel";
import { KnowledgeBase } from "@/types/kb";

type Step = "upload" | "confirm" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "confirm", label: "Confirm" },
  { id: "done", label: "Done" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kb, setKB] = useState<KnowledgeBase | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (selectedFile: File) => {
      if (selectedFile.type !== "application/pdf") {
        toast("Only PDF files are accepted", "error");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast("File is too large. Maximum size is 5 MB.", "error");
        return;
      }

      setFile(selectedFile);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("resume", selectedFile);
        const res = await api.post<{ kb: KnowledgeBase }>("/api/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setKB(res.data.kb);
        setStep("confirm");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to parse resume. Please try a cleaner PDF.";
        toast(message, "error");
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) void uploadFile(dropped);
    },
    [uploadFile]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="lg" className="text-sage" />
      </div>
    );
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await api.patch("/api/profile", { onboarded: true });
      setStep("done");
      setTimeout(() => router.push("/chat"), 1600);
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    try {
      await api.patch("/api/profile", { onboarded: true });
    } catch {
      // Best-effort — don't block the user
    }
    setStep("done");
    setTimeout(() => router.push("/chat"), 1600);
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-paper bg-grid-paper flex flex-col items-center justify-center px-4 py-12">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold transition-colors ${
                  stepIndex === i
                    ? "bg-sage text-white"
                    : stepIndex > i
                    ? "bg-sage/30 text-sage"
                    : "bg-border text-ink-faint"
                }`}
              >
                {stepIndex > i ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block transition-colors ${
                  stepIndex === i ? "text-ink" : "text-ink-faint"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-px transition-colors ${stepIndex > i ? "bg-sage/40" : "bg-border"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="w-full max-w-md space-y-6 animate-fadeIn">
          <div className="space-y-1.5">
            <p className="text-xs font-mono text-sage tracking-widest uppercase">Step 1 · Upload</p>
            <h1 className="text-2xl font-semibold text-ink">Upload your resume</h1>
            <p className="text-sm text-ink-muted">
              PDF format only, up to 5 MB. We&apos;ll use AI to extract your details automatically.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`w-full border border-dashed rounded-lg p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              dragging
                ? "border-sage bg-sage-light/50"
                : uploading
                ? "border-border bg-paper cursor-not-allowed"
                : "border-border hover:border-sage/50 hover:bg-sage-light/20"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" className="text-sage" />
                <p className="text-sm text-ink-muted">Parsing with AI…</p>
              </div>
            ) : (
              <>
                <div className={`w-11 h-11 border rounded flex items-center justify-center transition-colors ${dragging ? "border-sage text-sage" : "border-border text-ink-faint"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                {file ? (
                  <p className="text-sm font-medium text-ink">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-ink-muted">
                      <span className="text-sage font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-ink-faint">PDF · max 5 MB</p>
                  </>
                )}
              </>
            )}
          </div>

          <KBJsonImportPanel
            disabled={uploading}
            onSuccess={(imported) => {
              setKB(imported);
              setFile(null);
              setStep("confirm");
              toast("Imported from JSON — review your details below.", "success");
            }}
          />

          <Button variant="ghost" className="w-full" onClick={handleSkip} disabled={uploading}>
            Skip — I&apos;ll add my resume later
          </Button>
        </div>
      )}

      {/* Step 2: Confirm KB */}
      {step === "confirm" && kb && (
        <div className="w-full max-w-lg space-y-6 animate-fadeIn">
          <div className="space-y-1.5">
            <p className="text-xs font-mono text-sage tracking-widest uppercase">Step 2 · Confirm</p>
            <h1 className="text-2xl font-semibold text-ink">Does this look right?</h1>
            <p className="text-sm text-ink-muted">
              AI extracted the details below from your resume. You can edit everything later through chat.
            </p>
          </div>

          <div className="max-h-[50vh] overflow-y-auto rounded">
            <KBPreview kb={kb} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => { setStep("upload"); setFile(null); setKB(null); }}
              disabled={saving}
            >
              Re-upload
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={saving}
              onClick={handleConfirm}
            >
              Looks good — let&apos;s go
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === "done" && (
        <div className="space-y-4 animate-fadeIn text-center">
          <div className="w-12 h-12 rounded-full bg-sage-light border border-sage/20 flex items-center justify-center mx-auto text-sage text-xl">
            ✓
          </div>
          <h1 className="text-2xl font-semibold text-ink">You&apos;re all set</h1>
          <p className="text-sm text-ink-muted">Your knowledge base is ready. Taking you to the chat…</p>
          <Spinner size="md" className="text-sage mx-auto" />
        </div>
      )}
    </div>
  );
}
