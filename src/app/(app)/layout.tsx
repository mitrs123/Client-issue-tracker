import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthProvider } from "@/lib/auth-context";
import { ResponsiveLayout } from "@/components/responsive-layout";
import type { SafeUser } from "@/lib/types";
import { prisma } from "@/lib/prisma";

import { ToastProvider } from "@/components/toast";

/**
 * Authenticated application shell. Server component: resolves the session and
 * redirects unauthenticated users to /login (defence in depth beyond the API).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  // OPTIMIZATION: Retrieve the user's email address directly from the database, 
  // because the JWT session payload only contains name, role, and username.
  // This resolves the bug where a blank email was shown in the profile dropdown menu.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { email: true },
  });

  // SessionUser -> minimal SafeUser shape for the client auth context.
  const user: SafeUser = {
    id: session.id,
    username: session.username,
    name: session.name,
    role: session.role,
    email: dbUser?.email ?? "",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  };

  return (
    <ToastProvider>
      <AuthProvider user={user}>
        <ResponsiveLayout role={session.role}>{children}</ResponsiveLayout>
      </AuthProvider>
    </ToastProvider>
  );
}

