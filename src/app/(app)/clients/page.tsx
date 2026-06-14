import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listClients } from "@/services/user.service";
import { Icon } from "@/components/icon";
import { formatDate, initials } from "@/lib/format";

export default async function ClientsPage() {
  const actor = await getSessionUser();
  if (!actor) redirect("/login");
  if (actor.role !== "MANAGER") redirect("/dashboard");

  const clients = await listClients(actor);

  return (
    <div className="p-4 md:p-5 lg:p-6 mx-auto max-w-7xl">
      <div className="mb-5">
        <h2 className="text-[28px] md:text-[36px] font-bold text-secondary">Clients</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Everyone with access to report and track issues.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <Icon name="group" className="text-[40px] text-on-surface-variant opacity-40" />
            <p className="font-body-md text-on-surface-variant">No clients yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low">

                {["Name", "Username", "Email", "Joined"].map((h) => (
                  <th
                    key={h}
                    className="px-md py-4 font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {clients.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-container-low/50">
                  <td className="px-md py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-on-secondary">
                        {initials(c.name)}
                      </span>
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-md py-4 font-label-md text-label-md text-on-surface-variant">
                    {c.username}
                  </td>
                  <td className="px-md py-4 font-label-md text-label-md text-on-surface-variant">
                    {c.email}
                  </td>
                  <td className="px-md py-4 font-label-md text-label-md text-on-surface-variant">
                    {formatDate(c.createdAt.toISOString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );

}
