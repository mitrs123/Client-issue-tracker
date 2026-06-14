"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WebsiteStatusBadge,
  SeverityBadge,
  IssueBadge,
  IssueTypeBadge,
} from "@/components/badge";
import { formatDate, getTimeAgo } from "@/lib/enum-utils";
import type { IssueDetail, Comment, ApiResponse } from "@/lib/types";

export default function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        // Fetch issue detail
        const issueRes = await fetch(`/api/issues/${id}`, {
          credentials: "include",
        });
        const issueData: ApiResponse<IssueDetail> = await issueRes.json();

        if (issueData.success && issueData.data) {
          setIssue(issueData.data);

          // Fetch comments
          const commentsRes = await fetch(`/api/issues/${id}/comments`, {
            credentials: "include",
          });
          const commentsData: ApiResponse<Comment[]> =
            await commentsRes.json();

          if (commentsData.success && commentsData.data) {
            setComments(commentsData.data);
          }
        } else {
          setError("Failed to load issue");
        }
      } catch (err) {
        console.error("[v0] Failed to fetch issue:", err);
        setError("Failed to load issue details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIssue();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Link href="/issues">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Issues
          </Button>
        </Link>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-6 space-y-6">
        <Link href="/issues">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Issues
          </Button>
        </Link>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium">
            {error || "Issue not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Link */}
      <Link href="/issues">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Issues
        </Button>
      </Link>

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              #{issue.issueNo}: {issue.title}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {issue.description}
            </p>
          </div>
        </div>

        {/* Status and Meta Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <IssueBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
          <IssueTypeBadge type={issue.type} />
          <WebsiteStatusBadge status={issue.website.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Website
                </p>
                <Link
                  href={`/websites/${issue.website.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {issue.website.name}
                </Link>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Reporter
                </p>
                <p className="text-sm text-foreground">{issue.reporter.name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Created
                </p>
                <p className="text-sm text-foreground">
                  {formatDate(issue.createdAt)}
                </p>
              </div>

              {issue.assignedManager && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Assigned To
                  </p>
                  <p className="text-sm text-foreground">
                    {issue.assignedManager.name}
                  </p>
                </div>
              )}

              {issue.resolvedAt && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Resolved
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(issue.resolvedAt)}
                  </p>
                </div>
              )}

              {issue.closedAt && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Closed
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(issue.closedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {issue.attachments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Attachments
              </h2>
              <div className="space-y-2">
                {issue.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.sizeBytes / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Comments ({comments.length})
              </h2>
            </div>

            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-4 border-b border-border last:border-b-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {comment.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground">
                          {comment.author.name}
                        </p>
                        {comment.isInternal && (
                          <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
                            Internal
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {getTimeAgo(comment.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Status and Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 sticky top-6">
            <h3 className="font-semibold text-foreground">Status</h3>
            <div className="space-y-2">
              <IssueBadge status={issue.status} />
              <p className="text-sm text-muted-foreground">
                {issue.status === "RESOLVED"
                  ? "This issue has been resolved"
                  : issue.status === "CLOSED"
                  ? "This issue is closed"
                  : "This issue is still being worked on"}
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground mb-3">Severity</h3>
              <SeverityBadge severity={issue.severity} />
            </div>

            {issue.aiSuggestion && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  AI Suggestion
                </h3>
                <p className="text-sm text-muted-foreground">
                  {issue.aiSuggestion.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
