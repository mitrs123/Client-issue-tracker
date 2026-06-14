import { z } from "zod";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_ISSUE = 5;

/** Allowed upload types (Master Plan §3.2): image, pdf, txt, log, excel, word, docx. */
export const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "txt",
  "log",
  "csv",
  "xls",
  "xlsx",
  "doc",
  "docx",
] as const;

export const presignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_BYTES, "File exceeds the 10MB limit"),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() as string) : "";
}
