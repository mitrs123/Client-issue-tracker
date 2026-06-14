"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Makes a whole issues-table row navigable. The list page is a Server
 * Component, so the click-to-open behaviour lives here in a thin client
 * wrapper. The Issue # / Title cells keep their real <Link> (for middle-click
 * "open in new tab" and keyboard access); this just extends the clickable area
 * to the entire row. We ignore clicks that land on an interactive element so
 * inner links/buttons keep their own behaviour.
 */
export function IssueRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const target = e.target as HTMLElement;
      // Let genuine links/buttons handle their own clicks.
      if (target.closest("a, button")) return;
      router.push(`/issues/${id}`);
    },
    [id, router],
  );

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer transition-colors hover:bg-surface-container-low/50"
    >
      {children}
    </tr>
  );
}
