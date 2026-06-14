"use client";

import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SafeUser } from "@/lib/types";
import { getUserInitials } from "@/lib/enum-utils";
import Link from "next/link";

interface NavbarProps {
  user: SafeUser;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search issues, websites..."
            className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {getUserInitials(user.name)}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user.name.split(" ")[0]}
              </p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
