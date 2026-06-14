"use client";

import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { useAuth } from "@/lib/auth-context";
import type { SafeUser } from "@/lib/types";

interface AppShellProps {
  user: SafeUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={logout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
