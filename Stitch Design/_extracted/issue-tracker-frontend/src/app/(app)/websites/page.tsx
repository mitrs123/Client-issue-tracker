"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteStatusBadge } from "@/components/badge";
import { formatDate } from "@/lib/enum-utils";
import type { Website, ApiResponse } from "@/lib/types";

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch("/api/websites?pageSize=1000", {
          credentials: "include",
        });
        const data: ApiResponse<Website[]> = await response.json();

        if (data.success && data.data) {
          setWebsites(data.data);
        } else {
          setError("Failed to load websites");
        }
      } catch (err) {
        console.error("[v0] Failed to fetch websites:", err);
        setError("Failed to load websites");
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Websites</h1>
          <p className="text-muted-foreground">
            {websites.length} website{websites.length !== 1 ? "s" : ""} monitored
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Websites Grid */}
      {websites.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No websites found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((website) => (
            <Link
              key={website.id}
              href={`/websites/${website.id}`}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {website.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {website.url}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <WebsiteStatusBadge status={website.status} />
                  {website.lastCheckedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last checked:{" "}
                      {new Date(website.lastCheckedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Issues */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">
                    {website.openIssues} open issue
                    {website.openIssues !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Created Date */}
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(website.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
