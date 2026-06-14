import { z } from "zod";
import { paginationSchema } from "@/lib/validations/common";

export const issueTypeValues = [
  "BUG",
  "FEEDBACK",
  "SUGGESTION",
  "IMPROVEMENT",
] as const;
export const issueSeverityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const issueStatusValues = [
  "OPEN",
  "IN_REVIEW",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "RESOLVED",
  "CLOSED",
] as const;

export const issueTypeSchema = z.enum(issueTypeValues);
export const issueSeveritySchema = z.enum(issueSeverityValues);
export const issueStatusSchema = z.enum(issueStatusValues);

export type IssueTypeValue = (typeof issueTypeValues)[number];
export type IssueSeverityValue = (typeof issueSeverityValues)[number];
export type IssueStatusValue = (typeof issueStatusValues)[number];

export const createIssueSchema = z.object({
  websiteId: z.string().min(1, "Website is required"),
  title: z.string().min(3, "Title is too short").max(160),
  description: z.string().min(10, "Please add more detail").max(10_000),
  type: issueTypeSchema.default("BUG"),
  severity: issueSeveritySchema.default("MEDIUM"),
});
export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueStatusSchema = z.object({
  status: issueStatusSchema,
  note: z.string().max(2000).optional(),
});
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;

export const updateIssueSeveritySchema = z.object({
  severity: issueSeveritySchema,
  note: z.string().max(2000).optional(),
});
export type UpdateIssueSeverityInput = z.infer<typeof updateIssueSeveritySchema>;

export const listIssuesQuerySchema = paginationSchema.extend({
  status: issueStatusSchema.optional(),
  severity: issueSeveritySchema.optional(),
  type: issueTypeSchema.optional(),
  websiteId: z.string().optional(),
  search: z.string().max(160).optional(),
});
export type ListIssuesQuery = z.infer<typeof listIssuesQuerySchema>;
