import { cn } from "@/lib/utils";
import type {
  WebsiteStatus,
  IssueStatus,
  IssueSeverity,
  IssueType,
} from "@/lib/types";
import {
  getWebsiteStatusColor,
  getIssueSeverityColor,
  getIssueStatusColor,
  getIssueTypeDisplay,
  formatEnum,
} from "@/lib/enum-utils";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: WebsiteStatus;
  className?: string;
}

export function WebsiteStatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  return (
    <Badge className={cn(getWebsiteStatusColor(status), className)}>
      {formatEnum(status)}
    </Badge>
  );
}

interface SeverityBadgeProps {
  severity: IssueSeverity;
  className?: string;
}

export function SeverityBadge({
  severity,
  className,
}: SeverityBadgeProps) {
  return (
    <Badge className={cn(getIssueSeverityColor(severity), className)}>
      {formatEnum(severity)}
    </Badge>
  );
}

interface IssueBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function IssueBadge({ status, className }: IssueBadgeProps) {
  return (
    <Badge className={cn(getIssueStatusColor(status), className)}>
      {formatEnum(status)}
    </Badge>
  );
}

interface TypeBadgeProps {
  type: IssueType;
  className?: string;
}

export function IssueTypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <Badge
      className={cn(
        "border border-border text-foreground bg-transparent",
        className
      )}
    >
      {getIssueTypeDisplay(type)}
    </Badge>
  );
}
