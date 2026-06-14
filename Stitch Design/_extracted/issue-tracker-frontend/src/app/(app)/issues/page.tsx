"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form-input";
import {
  WebsiteStatusBadge,
  SeverityBadge,
  IssueBadge,
  IssueTypeBadge,
} from "@/components/badge";
import { getTimeAgo } from "@/lib/enum-utils";
import type { IssueListItem, ApiResponse, IssueStatus, IssueSeverity } from "@/lib/types";

interface FilterState {
  status?: IssueStatus;
  severity?: IssueSeverity;
  search: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<IssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: "" });

  // Fetch issues on mount
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("/api/issues?pageSize=1000", {
          credentials: "include",
        });
        const data: ApiResponse<IssueListItem[]> = await response.json();

        if (data.success && data.data) {
          setIssues(data.data);
          setFilteredIssues(data.data);
        }
      } catch (err) {
        console.error("[v0] Failed to fetch issues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = issues;

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(search) ||
          issue.issueNo.toString().includes(search) ||
          issue.website.name.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((issue) => issue.status === filters.status);
    }

    // Severity filter
    if (filters.severity) {
      filtered = filtered.filter(
        (issue) => issue.severity === filters.severity
      );
    }

    setFilteredIssues(filtered);
  }, [issues, filters]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Issues</h1>
          <p className="text-muted-foreground">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link href="/issues/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <FormInput
            placeholder="Search by title, issue #, or website..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value as IssueStatus) || undefined,
              }))
            }
            className="px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CLIENT">Waiting For Client</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filters.severity || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                severity: (e.target.value as IssueSeverity) || undefined,
              }))
            }
            className="px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      {filteredIssues.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No issues found</p>
          {filters.search || filters.status || filters.severity ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({ search: "", status: undefined, severity: undefined })
              }
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Website
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      #{issue.issueNo}: {issue.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <WebsiteStatusBadge status={issue.website.status} />
                      <span className="text-sm text-muted-foreground">
                        {issue.website.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <IssueTypeBadge type={issue.type} />
                  </td>
                  <td className="px-6 py-4">
                    <SeverityBadge severity={issue.severity} />
                  </td>
                  <td className="px-6 py-4">
                    <IssueBadge status={issue.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {issue.reporter.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {getTimeAgo(issue.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
