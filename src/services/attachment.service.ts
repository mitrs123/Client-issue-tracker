import { randomUUID } from "node:crypto";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import {
  getS3Client,
  isS3Enabled,
  S3_BUCKET,
  UPLOAD_URL_TTL_SECONDS,
  DOWNLOAD_URL_TTL_SECONDS,
} from "@/lib/s3";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES_PER_ISSUE,
  extensionOf,
  type PresignUploadInput,
} from "@/lib/validations/attachment";
import { recordIssueEvent } from "@/services/issue-event.service";

/** Loads an issue the actor may access (manager, reporter, or site owner). */
async function loadAccessibleIssue(actor: SessionUser, issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
    select: {
      id: true,
      websiteId: true,
      reporterId: true,
      website: { select: { clientId: true } },
    },
  });
  if (!issue) throw Errors.notFound("Issue not found");
  if (
    actor.role !== "MANAGER" &&
    issue.reporterId !== actor.id &&
    issue.website.clientId !== actor.id
  ) {
    throw Errors.forbidden();
  }
  return issue;
}

export async function createUploadUrl(
  actor: SessionUser,
  issueId: string,
  input: PresignUploadInput,
) {
  const s3 = getS3Client();
  if (!s3 || !isS3Enabled()) {
    throw Errors.featureDisabled("File uploads are not configured");
  }

  const issue = await loadAccessibleIssue(actor, issueId);

  const ext = extensionOf(input.fileName);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw Errors.badRequest(`Unsupported file type: .${ext || "unknown"}`);
  }

  const existing = await prisma.attachment.count({
    where: { issueId, deletedAt: null, status: { in: ["PENDING", "UPLOADED"] } },
  });
  if (existing >= MAX_FILES_PER_ISSUE) {
    throw Errors.badRequest(`At most ${MAX_FILES_PER_ISSUE} files per issue`);
  }

  // Key pattern: {website_id}/{issue_id}/{random}.{extension}
  const fileKey = `${issue.websiteId}/${issueId}/${randomUUID()}.${ext}`;

  const attachment = await prisma.attachment.create({
    data: {
      issueId,
      uploaderId: actor.id,
      fileKey,
      fileName: input.fileName,
      extension: ext,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      bucket: S3_BUCKET,
      status: "PENDING",
    },
  });

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      ContentType: input.mimeType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return { attachmentId: attachment.id, uploadUrl, key: fileKey };
}

export async function confirmUpload(actor: SessionUser, attachmentId: string) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, deletedAt: null },
    include: {
      issue: {
        select: { id: true, reporterId: true, website: { select: { clientId: true } } },
      },
    },
  });
  if (!attachment) throw Errors.notFound("Attachment not found");
  if (
    actor.role !== "MANAGER" &&
    attachment.issue.reporterId !== actor.id &&
    attachment.issue.website.clientId !== actor.id
  ) {
    throw Errors.forbidden();
  }
  if (attachment.status === "UPLOADED") return attachment;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.attachment.update({
      where: { id: attachmentId },
      data: { status: "UPLOADED" },
    });
    await recordIssueEvent(tx, {
      issueId: attachment.issueId,
      actorId: actor.id,
      type: "ATTACHMENT_ADDED",
      message: `Attached ${attachment.fileName}`,
    });
    return updated;
  });
}

export async function getDownloadUrl(actor: SessionUser, attachmentId: string) {
  const s3 = getS3Client();
  if (!s3 || !isS3Enabled()) {
    throw Errors.featureDisabled("File downloads are not configured");
  }

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, deletedAt: null, status: "UPLOADED" },
    include: {
      issue: {
        select: { reporterId: true, website: { select: { clientId: true } } },
      },
    },
  });
  if (!attachment) throw Errors.notFound("Attachment not found");
  if (
    actor.role !== "MANAGER" &&
    attachment.issue.reporterId !== actor.id &&
    attachment.issue.website.clientId !== actor.id
  ) {
    throw Errors.forbidden();
  }

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: attachment.fileKey }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
  return { url, fileName: attachment.fileName };
}
