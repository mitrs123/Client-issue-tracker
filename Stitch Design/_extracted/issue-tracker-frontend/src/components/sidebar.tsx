"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  Bug,
  Bell,
  Users,
  ChevronDown,
  LogOut,
} from "lucide-react";
import type { SafeUser } from "@/lib/types";
import { getUserInitials } from "@/lib/enum-utils";

interface SidebarProps {
  user: SafeUser;
  onLogout: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/issues", label: "Issues", icon: Bug },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const managerItems = [
  { href: "/clients", label: "Clients", icon: Users },
];

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const isManager = user.role === "MANAGER";

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col sticky top-0">
      {/* Logo/Brand */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Bug className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground text-lg">
            Issue Tracker
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {item.label === "Notifications" && (
                <div className="ml-auto w-2 h-2 rounded-full bg-red-500"></div>
              )}
            </Link>
          );
        })}

        {isManager && (
          <>
            <div className="my-4 px-3">
              <div className="h-px bg-sidebar-border"></div>
            </div>
            {managerItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-sidebar-primary-foreground">
              {getUserInitials(user.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
            "text-sidebar-foreground hover:bg-sidebar-accent/50",
            "transition-colors duration-200"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
