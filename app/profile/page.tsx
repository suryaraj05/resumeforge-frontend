"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Avatar, Button, Divider, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";

interface UserProfile {
  displayName: string;
  email: string;
  createdAt?: string;
  onboarded?: boolean;
  username?: string;
  profilePublic?: boolean;
  allowAnonymousComparison?: boolean;
  showContactOnProfile?: boolean;
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState("");
  const [profilePublic, setProfilePublic] = useState(true);
  const [allowCompare, setAllowCompare] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
      return;
    }
    if (user) {
      api
        .get("/api/profile")
        .then((res) => {
          const d = res.data as UserProfile;
          setProfile(d);
          setSettingsUsername(d.username ?? "");
          setProfilePublic(d.profilePublic !== false);
          setAllowCompare(Boolean(d.allowAnonymousComparison));
          setShowContact(Boolean(d.showContactOnProfile));
        })
        .catch(() => {
          setProfile({
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || "",
          });
        })
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  async function handleCopyUid() {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("User ID copied!", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const body: Record<string, unknown> = {
        profilePublic,
        allowAnonymousComparison: allowCompare,
        showContactOnProfile: showContact,
      };
      const u = settingsUsername.trim().toLowerCase();
      if (u && u !== (profile?.username ?? "")) {
        body.username = u;
      }
      const res = await api.put("/api/profile/settings", body);
      const d = res.data as UserProfile;
      setProfile((prev) => ({ ...prev, ...d } as UserProfile));
      setSettingsUsername(d.username ?? settingsUsername);
      toast("Settings saved", "success");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast(msg || "Could not save settings", "error");
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="lg" className="text-sage" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.displayName || user.displayName || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-paper bg-grid-paper">
      {/* Nav */}
      <header className="h-12 border-b border-border px-5 flex items-center justify-between">
        <Link
          href="/chat"
          className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span className="text-xs">Back to chat</span>
        </Link>
        <span className="text-sm font-semibold tracking-tight text-ink">
          Resume<span className="text-sage">Forge</span>
        </span>
        <div className="w-[80px]" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
        {/* Identity */}
        <div className="flex flex-col items-center gap-4 py-6">
          <Avatar name={displayName} size="xl" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-ink">{displayName}</h1>
            <p className="text-sm text-ink-muted mt-0.5">{profile?.email || user.email}</p>
          </div>
        </div>

        {/* User ID */}
        <div className="border border-border rounded">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-ink uppercase tracking-wide">User ID</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Share this with others to be added to groups.
            </p>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <code className="text-xs font-mono text-ink truncate flex-1">{user.uid}</code>
            <button
              onClick={handleCopyUid}
              className="text-xs font-medium text-sage hover:text-sage-dark transition-colors shrink-0 border border-sage/30 rounded px-2.5 py-1 hover:bg-sage-light"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Account details */}
        <div className="border border-border rounded divide-y divide-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Display name</span>
            <span className="text-sm text-ink">{displayName}</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Email</span>
            <span className="text-sm text-ink">{profile?.email || user.email}</span>
          </div>
          {profile?.createdAt && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Member since</span>
              <span className="text-sm text-ink">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Auth provider</span>
            <span className="text-sm text-ink capitalize">
              {user.providerData[0]?.providerId === "google.com" ? "Google" : "Email"}
            </span>
          </div>
        </div>

        <Divider />

        {/* Actions */}
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          Sign out
        </Button>
      </main>
    </div>
  );
}
