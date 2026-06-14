import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { clearSessionCookie } from "@/lib/cookies";

export const POST = handle(async () => {
  await clearSessionCookie();
  return ok({ loggedOut: true });
});
