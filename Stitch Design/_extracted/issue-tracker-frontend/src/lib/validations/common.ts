import { z } from "zod";

/** Shared pagination (server-side, 20 items/page per Master Plan §3.4). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

/** Route param for `[id]` segments. */
export const idParamSchema = z.object({ id: z.string().min(1) });

/** Parse URLSearchParams into a plain object for schema parsing. */
export function searchParamsToObject(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of sp.entries()) out[k] = v;
  return out;
}
