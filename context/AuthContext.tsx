"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getFirebaseAuth,
  onAuthStateChanged,
  signOut,
  type User,
} from "@/lib/firebase";
import api from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          await api.get("/api/auth/me");
        } catch {
          // User doc may not exist yet — handled in onboarding
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(getFirebaseAuth());
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
