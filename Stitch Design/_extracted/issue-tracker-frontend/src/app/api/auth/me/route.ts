import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { getSessionUser } from "@/lib/auth";

export const GET = handle(async () => {
  const user = await getSessionUser();
  return ok({ user });
});
