import { cn } from "@/lib/utils";
import { formatEnum } from "@/lib/format";
import { Icon } from "@/components/icon";
import type {
  IssueSeverity,
  IssueStatus,
  IssueType,
  WebsiteStatus,
} from "@/lib/types";

/* ---------------- Website status pill (dot + label) ---------------- */
const WEBSITE_STATUS: Record<
  WebsiteStatus,
  { pill: string; dot: string; pulse: boolean }
> = {
  ONLINE: { pill: "bg-green-100 text-green-700", dot: "bg-green-500", pulse: true },
  DEGRADED: { pill: "bg-orange-100 text-orange-700", dot: "bg-orange-500", pulse: false },
  DOWN: { pill: "bg-red-100 text-red-700", dot: "bg-red-500", pulse: false },
  UNKNOWN: {
    pill: "bg-surface-container text-on-surface-variant",
    dot: "bg-slate-400",
    pulse: false,
  },
};

export function WebsiteStatusPill({ status }: { status: WebsiteStatus }) {
  const s = WEBSITE_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md font-label-md font-bold",
        s.pill,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", s.dot, s.pulse && "animate-pulse")} />
      {status}
    </span>
  );
}

/* ---------------- Severity badge (uppercase pill) ---------------- */
const SEVERITY_PILL: Record<IssueSeverity, string> = {
  CRITICAL: "bg-red-50 text-red-700",
  HIGH: "bg-orange-50 text-orange-700",
  MEDIUM: "bg-blue-50 text-blue-700",
  LOW: "bg-slate-50 text-slate-700",
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-[10px] font-bold uppercase tracking-tighter",
        SEVERITY_PILL[severity],
      )}
    >
      {formatEnum(severity)}
    </span>
  );
}

/* ---------------- Severity dot + label (table style) ---------------- */
const SEVERITY_DOT: Record<IssueSeverity, { dot: string; text: string }> = {
  CRITICAL: { dot: "bg-error", text: "text-error" },
  HIGH: { dot: "bg-tertiary", text: "text-tertiary" },
  MEDIUM: { dot: "bg-amber-500", text: "" },
  LOW: { dot: "bg-slate-300", text: "text-on-surface-variant" },
};

export function SeverityDot({ severity }: { severity: IssueSeverity }) {
  const s = SEVERITY_DOT[severity];
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", s.dot)} />
      <span className={cn("text-label-md font-label-md", s.text)}>
        {formatEnum(severity)}
      </span>
    </div>
  );
}

/* ---------------- Issue status pill (uppercase) ---------------- */
const ISSUE_STATUS: Record<IssueStatus, string> = {
  OPEN: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  IN_REVIEW: "bg-secondary-container/40 text-on-secondary-container",
  IN_PROGRESS: "bg-surface-container-high text-on-surface-variant",
  WAITING_FOR_CLIENT: "bg-orange-50 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-surface-container text-on-surface-variant opacity-60",
};

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-[12px] font-label-md font-bold uppercase",
        ISSUE_STATUS[status],
      )}
    >
      {formatEnum(status)}
    </span>
  );
}

/* ---------------- Issue type chip (icon + label) ---------------- */
const ISSUE_TYPE: Record<IssueType, { icon: string; classes: string }> = {
  BUG: {
    icon: "bug_report",
    classes: "bg-secondary-container/30 text-on-secondary-container",
  },
  FEEDBACK: { icon: "forum", classes: "bg-primary-fixed text-primary" },
  SUGGESTION: { icon: "lightbulb", classes: "bg-primary-fixed text-primary" },
  IMPROVEMENT: { icon: "rocket_launch", classes: "bg-primary-fixed text-primary" },
};

export function IssueTypeBadge({ type }: { type: IssueType }) {
  const t = ISSUE_TYPE[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-label-md",
        t.classes,
      )}
    >
      <Icon name={t.icon} className="text-[14px]" />
      {formatEnum(type)}
    </span>
  );
}
