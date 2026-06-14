import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listWebsites } from "@/services/website.service";
import { listClients } from "@/services/user.service";
import { WebsitesList } from "@/components/websites-list";

export default async function WebsitesPage() {
  const actor = await getSessionUser();
  if (!actor) redirect("/login");

  const [{ items }, clients] = await Promise.all([
    listWebsites(actor, { page: 1, pageSize: 100 }),
    actor.role === "MANAGER" ? listClients(actor) : Promise.resolve([]),
  ]);

  const websiteItems = items.map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    status: w.status,
    lastCheckedAt: w.lastCheckedAt ? w.lastCheckedAt.toISOString() : null,
    openIssues: w.openIssues,
  }));

  const clientItems = clients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="p-4 md:p-5 lg:p-6 mx-auto max-w-7xl">
      <WebsitesList websites={websiteItems} clients={clientItems} role={actor.role} />
    </div>
  );

}

