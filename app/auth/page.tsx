"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getFirebaseAuth,
  getGoogleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "@/lib/firebase";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button, Input, Divider } from "@/components/ui";
import { useToast } from "@/components/ui";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [user, loading, router]);

  function validate() {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      let userCredential;
      if (mode === "signup") {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await api.post("/api/auth/onboard", {
          displayName: email.split("@")[0],
          email,
        });
        router.push("/onboarding");
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const meRes = await api.get("/api/auth/me");
        const userData = meRes.data;
        router.push(userData.onboarded ? "/chat" : "/onboarding");
      }
      void userCredential;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast("Invalid email or password", "error");
      } else if (code === "auth/email-already-in-use") {
        toast("An account with this email already exists", "error");
      } else {
        toast("Something went wrong. Please try again.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setSubmitting(true);
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      const user = result.user;

      const res = await api.post("/api/auth/onboard", {
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email,
      });

      if (res.data.alreadyExists) {
        const meRes = await api.get("/api/auth/me");
        router.push(meRes.data.onboarded ? "/chat" : "/onboarding");
      } else {
        router.push("/onboarding");
      }
    } catch {
      toast("Google sign-in failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-paper bg-grid-paper flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 text-sm font-semibold tracking-tight text-ink">
        Resume<span className="text-sage">Forge</span>
      </Link>

      <div className="w-full max-w-sm border border-border rounded bg-paper p-8 space-y-6">
        {/* Toggle */}
        <div className="flex border border-border rounded overflow-hidden">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              mode === "signin"
                ? "bg-sage text-white"
                : "text-ink-muted hover:text-ink hover:bg-sage-light"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              mode === "signup"
                ? "bg-sage text-white"
                : "text-ink-muted hover:text-ink hover:bg-sage-light"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Google */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleGoogleAuth}
          loading={submitting}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          }
        >
          Continue with Google
        </Button>

        <Divider label="or" />

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={submitting}
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-xs text-ink-faint text-center max-w-xs">
        By continuing, you agree to ResumeForge&apos;s terms of service and privacy policy.
      </p>
    </div>
  );
}
