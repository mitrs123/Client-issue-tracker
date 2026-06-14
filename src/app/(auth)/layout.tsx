import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ToastProvider } from "@/components/toast";

/** Public auth layout. Already-authenticated users skip to the dashboard. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <ToastProvider>{children}</ToastProvider>;
}
