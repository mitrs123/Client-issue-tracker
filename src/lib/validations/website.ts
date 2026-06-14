import { z } from "zod";

export const websiteStatusValues = [
  "ONLINE",
  "DOWN",
  "DEGRADED",
  "UNKNOWN",
] as const;
export const websiteStatusSchema = z.enum(websiteStatusValues);
export type WebsiteStatusValue = (typeof websiteStatusValues)[number];

export const createWebsiteSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  url: z.string().url("Must be a valid URL"),
  clientId: z.string().min(1, "Owner client is required"),
});
export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;

export const updateWebsiteSchema = z
  .object({
    name: z.string().min(1).max(120),
    url: z.string().url(),
    status: websiteStatusSchema,
  })
  .partial();
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;
