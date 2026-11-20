export const PROJECT_FILE_NAME = "project_data.json";

export type DirectoryHandle = any;

let nativePickerActive = false;

export function isNativePickerActive(): boolean {
  return nativePickerActive;
}

async function verifyPermission(
  handle: DirectoryHandle,
  mode: "read" | "readwrite"
): Promise<boolean> {
  if (!handle) return false;

  const options = { mode };

  if (typeof handle.queryPermission !== "function") return false;
  if (typeof handle.requestPermission !== "function") return false;

  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }

  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
}

export async function pickDirectory(
  mode: "read" | "readwrite" = "readwrite"
): Promise<DirectoryHandle> {
  if (!("showDirectoryPicker" in window)) {
    throw new Error(
      "File System Access API is not available. Use Chrome/Edge on localhost or HTTPS, or use Import/Export JSON fallback."
    );
  }

  if (nativePickerActive) {
    throw new Error(
      "A file or folder picker is already open. Close it and try again."
    );
  }

  nativePickerActive = true;

  try {
    const handle = await (window as any).showDirectoryPicker({ mode });

    const ok = await verifyPermission(handle, mode);
    if (!ok) {
      throw new Error("Folder permission was denied.");
    }

    return handle;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Folder selection was cancelled.");
    }

    if (
      error?.message &&
      error.message.includes("File picker already active")
    ) {
      throw new Error(
        "Another file or folder picker is already open. Close it, then try again."
      );
    }

    throw error;
  } finally {
    nativePickerActive = false;
  }
}

export async function readProjectFile(
  dir: DirectoryHandle
): Promise<any | null> {
  try {
    const fileHandle = await dir.getFileHandle(PROJECT_FILE_NAME, {
      create: false,
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function writeProjectFile(
  dir: DirectoryHandle,
  data: any
): Promise<void> {
  const fileHandle = await dir.getFileHandle(PROJECT_FILE_NAME, {
    create: true,
  });

  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export function downloadJson(filename: string, data: any): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}