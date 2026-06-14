/**
 * Shared frontend types mirroring the backend API contract (standardized
 * envelope + entities). Kept in sync with prisma/schema + services.
 */

export type Role = "CLIENT" | "MANAGER";

export type WebsiteStatus = "ONLINE" | "DOWN" | "DEGRADED" | "UNKNOWN";
export type IssueType = "BUG" | "FEEDBACK" | "SUGGESTION" | "IMPROVEMENT";
export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "IN_PROGRESS"
  | "WAITING_FOR_CLIENT"
  | "RESOLVED"
  | "CLOSED";

export type NotificationType =
  | "ISSUE_CREATED"
  | "ISSUE_STATUS_CHANGED"
  | "ISSUE_SEVERITY_CHANGED"
  | "ISSUE_RESPONSE"
  | "ISSUE_RESOLVED"
  | "ISSUE_COMMENT";

export type IssueEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "SEVERITY_CHANGED"
  | "TYPE_CHANGED"
  | "TITLE_EDITED"
  | "DESCRIPTION_EDITED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "COMMENT_ADDED"
  | "RESPONSE_ADDED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED"
  | "AI_SUGGESTION_GENERATED"
  | "AI_SUGGESTION_APPLIED";

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  name: string;
  url: string;
  status: WebsiteStatus;
  lastCheckedAt: string | null;
  clientId: string;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueListItem {
  id: string;
  issueNo: string;
  title: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  website: { id: string; name: string; url: string; status: WebsiteStatus };
  reporter: SafeUser;
  assignedManager: SafeUser | null;
}

export interface Attachment {
  id: string;
  fileName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
}

export interface AiSuggestion {
  status: string;
  suggestedTitle: string | null;
  suggestedCategory: IssueType | null;
  suggestedSeverity: IssueSeverity | null;
  enhancedDescription: string | null;
  summary: string | null;
  recommendedActions: string | null;
  suggestedResponse: string | null;
  provider: string;
  model: string | null;
}

export interface IssueDetail {
  id: string;
  issueNo: string;
  title: string;
  description: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  website: {
    id: string;
    name: string;
    url: string;
    status: WebsiteStatus;
    clientId: string;
  };
  reporter: SafeUser;
  assignedManager: SafeUser | null;
  attachments: Attachment[];
  aiSuggestion: AiSuggestion | null;
  _count: { comments: number };
}

export interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: SafeUser;
}

export interface IssueEvent {
  id: string;
  type: IssueEventType;
  fromValue: string | null;
  toValue: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: SafeUser | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  issueId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unread?: number;
}
