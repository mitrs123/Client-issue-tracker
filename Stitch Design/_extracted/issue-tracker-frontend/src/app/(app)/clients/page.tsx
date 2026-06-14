"use client";

import { useAuth } from "@/lib/auth-context";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

export default function ClientsPage() {
  const { user } = useAuth();

  // Only managers can view clients page
  if (user && user.role !== "MANAGER") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Clients</h1>
        <p className="text-muted-foreground">
          Manage and view all clients
        </p>
      </div>

      {/* Placeholder - Clients list would be implemented here */}
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Clients management page</p>
        <p className="text-sm text-muted-foreground">
          Client data will be displayed here. Connect to your database to see active clients.
        </p>
      </div>
    </div>
  );
}
