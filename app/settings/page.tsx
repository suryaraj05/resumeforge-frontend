"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import api from "@/lib/api";
import { KBJsonImportPanel } from "@/components/kb/KBJsonImportPanel";

interface UserSettings {
  username?: string;
  profilePublic?: boolean;
  allowAnonymousComparison?: boolean;
  showContactOnProfile?: boolean;
  displayName?: string;
  email?: string;
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings>({});
  const [fetching, setFetching] = useState(true);

  // Form state
  const [username, setUsername] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [allowComparison, setAllowComparison] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [clearingKB, setClearingKB] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<UserSettings>("/api/profile")
      .then((res) => {
        const d = res.data;
        setSettings(d);
        setUsername(d.username ?? "");
        setProfilePublic(d.profilePublic !== false);
        setAllowComparison(d.allowAnonymousComparison === true);
        setShowContact(d.showContactOnProfile === true);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await api.put("/api/profile/settings", {
        username: username.trim() || undefined,
        profilePublic,
        allowAnonymousComparison: allowComparison,
        showContactOnProfile: showContact,
      });
      toast("Settings saved", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Could not save settings";
      toast(msg, "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleClearChat() {
    if (!window.confirm("Clear all chat history? This cannot be undone.")) return;
    setClearingChat(true);
    try {
      await api.delete("/api/chat/history");
      toast("Chat history cleared", "success");
    } catch {
      toast("Could not clear chat history", "error");
    } finally {
      setClearingChat(false);
    }
  }

  async function handleClearKB() {
    if (!window.confirm("This will delete your entire knowledge base. Are you sure?")) return;
    setClearingKB(true);
    try {
      // Rollback to empty via updating with blank patch isn't ideal; instead we use the delete-account approach
      // but only for KB. We'll POST to kb/update with empty patches per section — simplest approach:
      for (const section of ["personal", "experience", "projects", "skills", "education", "certifications", "achievements", "publications"]) {
        await api.post("/api/profile/kb/update", { section, patch: null, summary: "Cleared KB section" });
      }
      toast("Knowledge base cleared", "success");
    } catch {
      toast("Could not clear knowledge base", "error");
    } finally {
      setClearingKB(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeletingAccount(true);
    try {
      await api.delete("/api/profile/account");
      toast("Account data deleted", "success");
      router.replace("/auth");
    } catch {
      toast("Could not delete account. Try again.", "error");
      setDeletingAccount(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="lg" className="text-sage" />
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="md" className="text-sage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper bg-grid-paper">
      <header className="border-b border-border px-5 py-4 flex items-center justify-between bg-paper sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-ink-muted hover:text-ink p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-ink">Settings</span>
        </div>
        <Link href="/chat" className="text-xs text-sage hover:underline">Back to chat</Link>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8 space-y-8">

        {/* Profile info */}
        <section>
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wide mb-1">Account</h2>
          <p className="text-xs text-ink-muted mb-4">
            {settings.email ?? user.email ?? "No email"}
          </p>
        </section>

        {/* Public profile settings */}
        <section className="border border-border rounded-md p-5 space-y-4">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wide">Public Profile</h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-ink" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alexsmith24"
              className="text-sm"
            />
            <p className="text-[10px] text-ink-faint">
              Your public profile URL: /u/{username || "your-username"}
            </p>
          </div>

          <ToggleRow
            label="Public profile"
            description="Anyone with the link can view your profile"
            checked={profilePublic}
            onChange={setProfilePublic}
          />

          <ToggleRow
            label="Show contact info on profile"
            description="Display email, LinkedIn, and GitHub publicly"
            checked={showContact}
            onChange={setShowContact}
          />

          <ToggleRow
            label="Allow anonymous peer comparison"
            description="Let group members compare skills anonymously against your profile"
            checked={allowComparison}
            onChange={setAllowComparison}
          />

          <Button
            variant="primary"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full"
          >
            {savingProfile ? "Saving…" : "Save settings"}
          </Button>
        </section>

        <section className="border border-border rounded-md p-5 space-y-3">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wide">Knowledge base</h2>
          <p className="text-xs text-ink-muted">
            No PDF upload or API quota? Use an external LLM with the copyable prompt, then paste JSON here.
          </p>
          <KBJsonImportPanel
            onSuccess={() => {
              toast("Knowledge base updated from JSON.", "success");
            }}
          />
        </section>

        {/* Danger zone */}
        <section className="border border-red-200/60 rounded-md p-5 space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-red-600/80 uppercase tracking-wide">Danger Zone</h2>
            <p className="text-xs text-ink-muted mt-0.5">These actions are irreversible.</p>
          </div>

          <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-ink">Clear chat history</p>
              <p className="text-xs text-ink-muted">Removes all messages from your chat. Does not affect your KB.</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleClearChat}
              disabled={clearingChat}
              className="shrink-0 text-xs"
            >
              {clearingChat ? "Clearing…" : "Clear"}
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-ink">Clear knowledge base</p>
              <p className="text-xs text-ink-muted">Deletes all your profile data. Start fresh.</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleClearKB}
              disabled={clearingKB}
              className="shrink-0 text-xs"
            >
              {clearingKB ? "Clearing…" : "Clear KB"}
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-red-600">Delete account</p>
              <p className="text-xs text-ink-muted">
                Permanently removes all your data.{" "}
                {confirmDelete && (
                  <span className="text-red-600 font-medium">Click again to confirm.</span>
                )}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="shrink-0 text-xs"
            >
              {deletingAccount ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete account"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked ? "bg-sage" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
