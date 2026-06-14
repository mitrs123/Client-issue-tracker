import { Prisma, type IssueEventType } from "@prisma/client";

/**
 * Append an entry to the issue audit trail / timeline. Accepts a transaction
 * client (or the base client) so it can participate in atomic multi-table
 * updates (Master Plan §2.2 — transactions for multi-table operations).
 */
export interface RecordIssueEventInput {
  issueId: string;
  type: IssueEventType;
  actorId?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export function recordIssueEvent(
  db: Prisma.TransactionClient,
  input: RecordIssueEventInput,
) {
  return db.issueEvent.create({
    data: {
      issueId: input.issueId,
      type: input.type,
      actorId: input.actorId ?? null,
      fromValue: input.fromValue ?? null,
      toValue: input.toValue ?? null,
      message: input.message ?? null,
      metadata: input.metadata,
    },
  });
}
