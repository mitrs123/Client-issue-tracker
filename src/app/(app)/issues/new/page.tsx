import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listWebsites } from "@/services/website.service";
import { ReportIssueForm } from "@/components/report-issue-form";
import { Icon } from "@/components/icon";

export default async function NewIssuePage() {
  const actor = await getSessionUser();
  if (!actor) redirect("/login");

  const { items } = await listWebsites(actor, { page: 1, pageSize: 100 });
  const websites = items.map((w) => ({ id: w.id, name: w.name }));

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-5 lg:p-6">

      <div className="mb-5">
        <nav className="mb-2 flex items-center gap-2">
          <Link href="/dashboard" className="font-label-md text-label-md text-on-surface-variant hover:text-primary">
            Dashboard
          </Link>
          <Icon name="chevron_right" className="text-[16px] text-on-surface-variant" />
          <span className="font-label-md text-label-md font-bold text-primary">
            Report Issue
          </span>
        </nav>
        <h2 className="mb-1 font-headline-md text-[28px] font-bold text-primary">
          Create Issue Report
        </h2>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Log a new technical issue or request. Provide detailed information to
          help our team resolve it faster.
        </p>
      </div>

      <ReportIssueForm websites={websites} />

      {/* Tips bento */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative flex items-center overflow-hidden rounded-xl bg-secondary p-4 text-white md:col-span-2">
          <div className="relative z-10">
            <h4 className="mb-1 font-body-lg text-body-lg font-bold">
              Need immediate assistance?
            </h4>
            <p className="font-label-md text-label-md text-white/70">
              For critical production outages, set severity to Critical so the
              team is alerted right away.
            </p>
          </div>
          <Icon
            name="support_agent"
            className="absolute -right-6 text-[140px] opacity-10"
          />
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-surface-container-high p-4">
          <p className="font-label-md text-label-md italic text-on-surface-variant">
            &ldquo;Precise issue titles reduce triage time by up to 40%.&rdquo;
          </p>
          <p className="mt-2 font-label-md text-label-md font-bold text-primary">
            — Engineering Handbook
          </p>
        </div>
      </div>
    </div>
  );
}
