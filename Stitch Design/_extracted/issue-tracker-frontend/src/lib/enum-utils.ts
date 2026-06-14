/**
 * Utility functions for formatting and displaying enums.
 * Converts ENUM_CONSTANT format to "Title Case" format.
 */

import type {
  WebsiteStatus,
  IssueStatus,
  IssueSeverity,
  IssueType,
  NotificationType,
} from "./types";

/** Formats enum string: CONSTANT_CASE -> Title Case */
export function formatEnum(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Get visual color class for website status */
export function getWebsiteStatusColor(status: WebsiteStatus): string {
  const colorMap: Record<WebsiteStatus, string> = {
    ONLINE: "text-green-500 bg-green-500/10 border border-green-500/30",
    DOWN: "text-red-500 bg-red-500/10 border border-red-500/30",
    DEGRADED: "text-amber-500 bg-amber-500/10 border border-amber-500/30",
    UNKNOWN: "text-muted-foreground bg-muted/30 border border-border",
  };
  return colorMap[status];
}

/** Get visual color class for issue severity */
export function getIssueSeverityColor(severity: IssueSeverity): string {
  const colorMap: Record<IssueSeverity, string> = {
    LOW: "text-blue-400 bg-blue-500/10 border border-blue-500/30",
    MEDIUM: "text-blue-500 bg-blue-500/10 border border-blue-500/30",
    HIGH: "text-amber-500 bg-amber-500/10 border border-amber-500/30",
    CRITICAL: "text-red-500 bg-red-500/10 border border-red-500/30",
  };
  return colorMap[severity];
}

/** Get visual color class for issue status */
export function getIssueStatusColor(status: IssueStatus): string {
  const colorMap: Record<IssueStatus, string> = {
    OPEN: "text-blue-500 bg-blue-500/10 border border-blue-500/30",
    IN_REVIEW: "text-violet-500 bg-violet-500/10 border border-violet-500/30",
    IN_PROGRESS: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/30",
    WAITING_FOR_CLIENT: "text-amber-500 bg-amber-500/10 border border-amber-500/30",
    RESOLVED: "text-green-500 bg-green-500/10 border border-green-500/30",
    CLOSED: "text-muted-foreground bg-muted/30 border border-border",
  };
  return colorMap[status];
}

/** Get display name for issue type (neutral, outline style) */
export function getIssueTypeDisplay(type: IssueType): string {
  const displayMap: Record<IssueType, string> = {
    BUG: "Bug",
    FEEDBACK: "Feedback",
    SUGGESTION: "Suggestion",
    IMPROVEMENT: "Improvement",
  };
  return displayMap[type];
}

/** Format a date string to a readable format */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Format a date string to short format (e.g., "Jun 14") */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Get time ago format (e.g., "2 hours ago") */
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDateShort(dateString);
}

/** Get user initials from name */
export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
