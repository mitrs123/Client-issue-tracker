import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
  // Manager-only internal note (hidden from clients); validated again server-side.
  isInternal: z.boolean().optional().default(false),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
