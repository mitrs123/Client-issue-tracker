import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getIssue, getIssueTimeline } from "@/services/issue.service";
import { listComments } from "@/services/comment.service";
import { Icon } from "@/components/icon";
import {
  IssueStatusBadge,
  IssueTypeBadge,
  SeverityBadge,
} from "@/components/badges";
import { IssueAdminControls } from "@/components/issue-admin-controls";
import { CommentComposer } from "@/components/comment-composer";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { GenerateAiButton } from "@/components/generate-ai-button";
import { AiApplyControls } from "@/components/ai-apply-controls";
import { TimelineDrawer } from "@/components/timeline-drawer";
import { isAiEnabled } from "@/lib/ai";
import { isS3Enabled } from "@/lib/s3";
import { formatDate, formatEnum, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";



export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await getSessionUser();
  if (!actor) redirect("/login");
  const { id } = await params;

  let issue: Awaited<ReturnType<typeof getIssue>>;
  try {
    issue = await getIssue(actor, id);
  } catch {
    notFound();
  }

  const [comments, timeline] = await Promise.all([
    listComments(actor, id, issue),
    getIssueTimeline(actor, id, issue),
  ]);
  const isManager = actor.role === "MANAGER";
  const s3Enabled = isS3Enabled();
  const aiEnabled = isAiEnabled();

  return (
    <div className="p-4 md:p-5 lg:p-6 mx-auto max-w-7xl">

      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <Link
            href="/issues"
            className="mb-2 inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-tertiary"
          >
            <Icon name="arrow_back" className="text-[18px]" /> Back to issues
          </Link>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-white">
              {issue.issueNo}
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="font-label-md text-label-md text-on-surface-variant">
              Created {timeAgo(issue.createdAt.toISOString())}
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            {/* OPTIMIZATION: Render Timeline as a slide-over drawer triggered here to declutter the workspace */}
            <TimelineDrawer timeline={timeline} />
          </div>
          <h1 className="max-w-3xl font-headline-md text-[24px] font-bold leading-tight text-on-surface">
            {issue.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <IssueTypeBadge type={issue.type} />
            <SeverityBadge severity={issue.severity} />
            <IssueStatusBadge status={issue.status} />
          </div>
        </div>
      </div>

      {isManager && (
        <div className="mb-5">
          <IssueAdminControls
            issueId={issue.id}
            status={issue.status}
            severity={issue.severity}
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* Main column */}
        <div className="col-span-12 space-y-md lg:col-span-8">
          <section>
            <SectionLabel>Description</SectionLabel>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
              <p className="whitespace-pre-wrap font-body-md text-body-md leading-relaxed text-on-surface">
                {issue.description}
              </p>
              <AttachmentsPanel
                issueId={issue.id}
                attachments={issue.attachments.map((a) => ({
                  id: a.id,
                  fileName: a.fileName,
                  sizeBytes: a.sizeBytes,
                }))}
                canUpload={s3Enabled}
              />
            </div>
          </section>

          <section>
            <SectionLabel>Conversation ({comments.length})</SectionLabel>
            <div className="space-y-md">
              {comments.length === 0 && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No messages yet.
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-on-secondary">
                    {initials(c.author.name)}
                  </span>
                  <div
                    className={cn(
                      "flex-1 rounded-xl rounded-tl-none border p-md",
                      c.isInternal
                        ? "border-amber-200/60 bg-amber-50/60"
                        : "border-outline-variant/30 bg-surface-container-lowest",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold">
                        {c.author.name}
                        <span className="ml-2 font-normal text-on-surface-variant">
                          • {formatEnum(c.author.role)}
                        </span>
                        {c.isInternal && (
                          <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-900">
                            Internal Only
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {timeAgo(c.createdAt.toISOString())}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "whitespace-pre-wrap font-body-md text-body-md",
                        c.isInternal ? "text-amber-900" : "text-on-surface",
                      )}
                    >
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
              <CommentComposer issueId={issue.id} canPostInternal={isManager} />
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="col-span-12 space-y-md lg:col-span-4">
          <RailCard title="Issue Context">
            <div className="space-y-4">
              <Row label="Website">
                <a
                  href={issue.website.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-label-md text-label-md font-bold text-tertiary hover:underline"
                >
                  {issue.website.name}
                  <Icon name="open_in_new" className="text-[14px]" />
                </a>
              </Row>
              <Row label="Reporter">{issue.reporter.name}</Row>
              <Row label="Assigned to">
                {issue.assignedManager?.name ?? "—"}
              </Row>
              <Row label="Created">{formatDate(issue.createdAt.toISOString())}</Row>
              <Row label="Updated">{formatDate(issue.updatedAt.toISOString())}</Row>
              {issue.resolvedAt && (
                <Row label="Resolved">
                  {formatDate(issue.resolvedAt.toISOString())}
                </Row>
              )}
            </div>
          </RailCard>

          {/* OPTIMIZATION: AI Suggestions are displayed above the Timeline on the right rail 
             for Managers to ensure immediate visibility and actionability when they open an issue. */}
          {isManager && (
            <div className="relative overflow-hidden rounded-xl bg-secondary p-md text-on-secondary">
              <div className="mb-4 flex items-center gap-2">
                <Icon name="auto_awesome" fill className="text-tertiary" />
                <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">
                  AI Suggestions
                </h3>
              </div>
              {issue.aiSuggestion && issue.aiSuggestion.status === "SUCCESS" ? (
                <div className="space-y-3">
                  {(issue.aiSuggestion.suggestedSeverity ||
                    issue.aiSuggestion.suggestedStatus) && (
                      <AiApplyControls
                        issueId={issue.id}
                        currentSeverity={issue.severity}
                        currentStatus={issue.status}
                        suggestedSeverity={issue.aiSuggestion.suggestedSeverity}
                        suggestedStatus={issue.aiSuggestion.suggestedStatus}
                      />
                    )}
                  {issue.aiSuggestion.summary && (
                    <AiBlock label="Summary" value={issue.aiSuggestion.summary} />
                  )}
                  {issue.aiSuggestion.recommendedActions && (
                    <AiBlock
                      label="Recommended actions"
                      value={issue.aiSuggestion.recommendedActions}
                    />
                  )}
                  {issue.aiSuggestion.suggestedResponse && (
                    <AiBlock
                      label="Suggested response"
                      value={issue.aiSuggestion.suggestedResponse}
                    />
                  )}
                  <p className="text-xs italic text-white/60">
                    Suggestions only — review before applying ·{" "}
                    {issue.aiSuggestion.provider}
                  </p>
                  {aiEnabled && (
                    <GenerateAiButton issueId={issue.id} hasExisting />
                  )}
                </div>
              ) : aiEnabled ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/70">
                    {issue.aiSuggestion?.status === "FAILED"
                      ? "The last AI analysis failed. You can retry or proceed manually."
                      : "Generate AI suggestions for category, severity, summary, recommended actions, and a draft response."}
                  </p>
                  <GenerateAiButton
                    issueId={issue.id}
                    hasExisting={Boolean(issue.aiSuggestion)}
                  />
                </div>
              ) : (
                <p className="text-sm text-white/70">
                  AI analysis isn&apos;t configured. Add a provider API key to
                  enable suggestions; manual entry works as usual.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-md border-b border-outline-variant/10 pb-2 font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
      {children}
    </h2>
  );
}

function RailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
      <h3 className="mb-md font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-label-md text-label-md text-on-surface-variant">
        {label}
      </span>
      <span className="text-right font-label-md text-label-md font-bold text-on-surface">
        {children}
      </span>
    </div>
  );
}

function AiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="mb-1 text-[11px] font-bold uppercase text-white/80">{label}</p>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/70">
        {value}
      </p>
    </div>
  );
}
