"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteStatusBadge, SeverityBadge, IssueBadge } from "@/components/badge";
import { getTimeAgo } from "@/lib/enum-utils";
import type { IssueListItem, ApiResponse } from "@/lib/types";

interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgress: number;
  resolvedIssues: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIssues: 0,
    openIssues: 0,
    inProgress: 0,
    resolvedIssues: 0,
  });
  const [recentIssues, setRecentIssues] = useState<IssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all issues to calculate stats
        const response = await fetch("/api/issues?pageSize=1000", {
          credentials: "include",
        });
        const data: ApiResponse<IssueListItem[]> = await response.json();

        if (data.success && data.data) {
          const issues = data.data;
          
          // Calculate stats
          setStats({
            totalIssues: issues.length,
            openIssues: issues.filter(i => i.status === "OPEN").length,
            inProgress: issues.filter(i => i.status === "IN_PROGRESS").length,
            resolvedIssues: issues.filter(i => i.status === "RESOLVED").length,
          });

          // Get recent issues (first 5)
          setRecentIssues(issues.slice(0, 5));
        }
      } catch (err) {
        console.error("[v0] Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your issues and websites
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issues */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft hover:border-primary/30 transition-smooth">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Total Issues
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.totalIssues}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-primary/20 flex-shrink-0" />
          </div>
        </div>

        {/* Open Issues */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft hover:border-primary/30 transition-smooth">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Open
              </p>
              <p className="text-3xl font-bold text-primary">
                {stats.openIssues}
              </p>
            </div>
            <Clock className="w-12 h-12 text-primary/20 flex-shrink-0" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft hover:border-primary/30 transition-smooth">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-3xl font-bold text-accent">
                {stats.inProgress}
              </p>
            </div>
            <Clock className="w-12 h-12 text-accent/20 flex-shrink-0" />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft hover:border-primary/30 transition-smooth">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Resolved
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--status-resolved)' }}>
                {stats.resolvedIssues}
              </p>
            </div>
            <CheckCircle2 className="w-12 h-12 flex-shrink-0" style={{ color: 'rgb(from var(--status-resolved) r g b / 0.2)' }} />
          </div>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Recent Issues
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Latest activity from your tracked websites
            </p>
          </div>
          <Link href="/issues">
            <Button size="sm" variant="outline">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {recentIssues.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center shadow-soft">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No issues reported yet</p>
            <p className="text-xs text-muted-foreground/60 mt-2">Issues will appear here when they&apos;re created</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-border hover:bg-muted/20 transition-smooth"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="text-sm font-medium text-primary hover:text-accent transition-colors"
                        >
                          #{issue.issueNo}: {issue.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {issue.website.name}
                      </td>
                      <td className="px-6 py-4">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="px-6 py-4">
                        <IssueBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {getTimeAgo(issue.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
