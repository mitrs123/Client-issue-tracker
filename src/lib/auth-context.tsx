"use client";

import { createContext, useContext } from "react";
import type { SafeUser } from "@/lib/types";

/**
 * Lightweight client auth context. The current user is resolved server-side
 * (in the (app) layout) and passed in, so there is no client fetch on mount.
 * Exposes a logout action used by the navbar profile menu.
 */
interface AuthContextValue {
  user: SafeUser;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
