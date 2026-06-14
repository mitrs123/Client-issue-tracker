"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatBytes } from "@/lib/format";

const MAX_BYTES = 10 * 1024 * 1024;

export interface AttachmentView {
  id: string;
  fileName: string;
  sizeBytes: number;
}

import { useToast } from "@/components/toast";

export function AttachmentsPanel({
  issueId,
  attachments,
  canUpload,
}: {
  issueId: string;
  attachments: AttachmentView[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download(id: string) {
    try {
      const { url } = await apiFetch<{ url: string }>(
        `/api/attachments/${id}/download`,
      );
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    }
  }

  /**
   * 📤 FILE UPLOAD HANDLER:
   * Handles the multi-step file upload workflow:
   * 1. Register attachment entry with server to get a presigned S3 URL.
   * 2. Upload the raw binary stream directly to S3 via PUT.
   * 3. Confirm complete status to server.
   * This is wrapped in a toast notification to display upload status.
   */
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File exceeds the 10MB limit");
      e.target.value = "";
      return;
    }
    setBusy(true);

    const uploadSequence = (async () => {
      const { attachmentId, uploadUrl } = await apiFetch<{
        attachmentId: string;
        uploadUrl: string;
      }>(`/api/issues/${issueId}/attachments`, {
        method: "POST",
        json: {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        },
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error("Upload to storage failed");
      await apiFetch(`/api/attachments/${attachmentId}/confirm`, {
        method: "POST",
      });
    })();

    try {
      await toastPromise(uploadSequence, {
        loading: `Uploading ${file.name}...`,
        success: `${file.name} uploaded successfully!`,
        error: (err) => err instanceof Error ? err.message : "Upload failed",
      });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed",
      );
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  if (attachments.length === 0 && !canUpload) return null;

  return (
    <div className="mt-md border-t border-outline-variant/10 pt-md">
      <p className="mb-sm font-label-md text-label-md font-bold text-on-surface">
        Attachments ({attachments.length})
      </p>
      {attachments.length > 0 && (
        <div className="mb-3 grid grid-cols-1 gap-md sm:grid-cols-2">
          {attachments.map((a) => (
            <button
              key={a.id}
              onClick={() => download(a.id)}
              className="group flex items-center gap-3 rounded-lg border border-outline-variant/30 p-3 text-left transition-colors hover:bg-surface-container-low"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container-high text-tertiary">
                <Icon name="description" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-label-md text-label-md font-bold">
                  {a.fileName}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {formatBytes(a.sizeBytes)}
                </p>
              </div>
              <Icon
                name="download"
                className="text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          ))}
        </div>
      )}
      {canUpload && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant/30 bg-surface-container-low/30 p-4 transition-all hover:bg-surface-container-low disabled:opacity-60"
        >
          <Icon
            name={busy ? "progress_activity" : "cloud_upload"}
            className={busy ? "animate-spin text-on-surface-variant" : "text-on-surface-variant"}
          />
          <p className="text-[12px] text-on-surface-variant">
            {busy ? "Uploading…" : "Click to add a file"}
          </p>
          <p className="text-[10px] uppercase text-on-surface-variant/60">
            Image, PDF, log (max 10MB)
          </p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFile}
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.log,.csv,.xls,.xlsx,.doc,.docx"
      />
      {error && (
        <p className="mt-2 font-label-md text-label-md text-error">{error}</p>
      )}
    </div>
  );
}
