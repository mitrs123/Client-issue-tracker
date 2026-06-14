import { handle } from "@/lib/route-handler";
import { ok, paginationMeta } from "@/lib/api-response";
import { requireRole, requireUser } from "@/lib/auth";
import {
  paginationSchema,
  searchParamsToObject,
} from "@/lib/validations/common";
import { createWebsiteSchema } from "@/lib/validations/website";
import { createWebsite, listWebsites } from "@/services/website.service";

export const GET = handle(async (req) => {
  const actor = await requireUser();
  const { page, pageSize } = paginationSchema.parse(
    searchParamsToObject(req.nextUrl.searchParams),
  );
  const { items, total } = await listWebsites(actor, { page, pageSize });
  return ok(items, { meta: paginationMeta(total, page, pageSize) });
});

export const POST = handle(async (req) => {
  const actor = await requireRole("MANAGER");
  const body = await req.json().catch(() => ({}));
  const input = createWebsiteSchema.parse(body);
  const website = await createWebsite(actor, input);
  return ok(website, { status: 201 });
});
