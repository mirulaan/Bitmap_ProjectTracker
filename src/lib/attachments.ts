import type { AttachmentFile } from "../types";
import { uid } from "./project";

export const ATTACHMENTS_DIR = "attachments";

export async function ensureAttachmentsDir(
  projectDir: any
): Promise<any> {
  return await projectDir.getDirectoryHandle(ATTACHMENTS_DIR, {
    create: true,
  });
}

export async function copyFileIntoAttachments(
  projectDir: any,
  file: File,
  notes = "",
  addedBy = ""
): Promise<AttachmentFile> {
  const attachmentsDir = await ensureAttachmentsDir(projectDir);
  const id = uid("att");

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";

  const storedName = `${id}${ext}`;

  const fileHandle = await attachmentsDir.getFileHandle(storedName, {
    create: true,
  });

  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();

  return {
    id,
    fileName: file.name,
    storedPath: `${ATTACHMENTS_DIR}/${storedName}`,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
    uploadedDate: new Date().toISOString(),
    notes,
    addedBy,
  };
}

export async function readAttachmentBlob(
  projectDir: any,
  attachment: AttachmentFile
): Promise<Blob> {
  const fileName = attachment.storedPath.split("/").pop()!;
  const attachmentsDir = await projectDir.getDirectoryHandle(
    ATTACHMENTS_DIR
  );

  const fileHandle = await attachmentsDir.getFileHandle(fileName);
  const file = await fileHandle.getFile();

  return file;
}

export async function deleteAttachmentFile(
  projectDir: any,
  attachment: AttachmentFile
): Promise<void> {
  const fileName = attachment.storedPath.split("/").pop()!;
  const attachmentsDir = await projectDir.getDirectoryHandle(
    ATTACHMENTS_DIR
  );

  try {
    await attachmentsDir.removeEntry(fileName);
  } catch {
    /* file may already be missing */
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function isPreviewable(
  mimeType: string
): "pdf" | "image" | "text" | null {
  if (mimeType === "application/pdf") return "pdf";

  if (mimeType.startsWith("image/")) return "image";

  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/csv"
  ) {
    return "text";
  }

  return null;
}