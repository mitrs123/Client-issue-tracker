"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  managerOnly?: boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Websites", href: "/websites", icon: "language" },
  { label: "Issues", href: "/issues", icon: "error_outline" },
  { label: "Clients", href: "/clients", icon: "group", managerOnly: true },
];

export function Sidebar({
  role,
  open = false,
  onClose,
}: {
  role: Role;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((i) => !i.managerOnly || role === "MANAGER");

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-secondary/35 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant/10 bg-[#201747] px-sm py-md transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-xl flex items-center justify-between px-4">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-white">
              IssueTracker
            </h1>
            <p className="font-label-md text-label-md text-white/60">
              SaaS Platform
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 md:hidden"
              aria-label="Close menu"
            >
              <Icon name="close" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                  active
                    ? "bg-white/10 font-bold text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon name={item.icon} />
                <span className="font-label-md text-label-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pb-2">
          <button
            onClick={() => {
              router.push("/issues/new");
              handleLinkClick();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-tertiary py-3 font-label-md text-label-md font-bold text-on-tertiary transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <Icon name="add" className="text-[20px]" />
            Report Issue
          </button>
        </div>
      </aside>
    </>
  );
}

