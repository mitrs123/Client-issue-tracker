import { S3Client } from "@aws-sdk/client-s3";
import { env, features } from "@/lib/env";

/**
 * S3 client singleton. Returns null when storage isn't configured so callers
 * can disable attachment features gracefully (.clauderules §3).
 */
let client: S3Client | null = null;

export function isS3Enabled(): boolean {
  return features.s3;
}

export function getS3Client(): S3Client | null {
  if (!isS3Enabled()) return null;
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION ?? "us-east-1",
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.S3_ENDPOINT), // needed for S3-compatible hosts
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

export const S3_BUCKET = env.S3_BUCKET;

export const UPLOAD_URL_TTL_SECONDS = 120; // 2 minutes (Master Plan §3.2)
export const DOWNLOAD_URL_TTL_SECONDS = 300; // 5 minutes
