import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AttachmentFile,
  Comment,
  Group,
  Phase,
  Project,
  ProjectSettings,
  Task,
  User,
} from "../types";
import {
  collectDescendantIds,
  createAutomationTemplateProject,
  createDemoProject,
  normalizeProject,
  uid,
} from "../lib/project";
import {
  downloadJson,
  pickDirectory,
  readJsonFile,
  readProjectFile,
  writeProjectFile,
  type DirectoryHandle,
} from "../lib/fs";
import { addDays, diffDays } from "../lib/date";

import {
  getDirectoryHandle,
  removeDirectoryHandle,
  saveDirectoryHandle,
  verifyPermission,
} from "../lib/idb";

import {
  getLastProject,
  getRecentProjects,
  removeRecentProject,
  upsertRecentProject,
  type RecentProject,
} from "../lib/recent";

import {
  copyFileIntoAttachments,
  deleteAttachmentFile,
} from "../lib/attachments";

interface ProjectContextValue {
  project: Project;
  directoryHandle: DirectoryHandle | null;
  dirty: boolean;
  statusMessage: string;
  view: "welcome" | "app";
  setView: (v: "welcome" | "app") => void;
  recentProjects: RecentProject[];
  lastProject: RecentProject | null;
  pickerBusy: boolean;

  openFolder: () => Promise<void>;
  createProjectFolder: () => Promise<void>;
  saveNow: () => Promise<boolean>;
  exportJson: () => void;
  importJsonFile: (file: File) => Promise<void>;
  loadDemo: () => void;
  newFromTemplate: () => void;
  resumeLastProject: () => Promise<boolean>;
  resumeProject: (handleKey: string) => Promise<boolean>;
  forgetProject: (handleKey: string) => void;

  updateProject: (patch: Partial<Project>) => void;
  updateSettings: (patch: Partial<ProjectSettings>) => void;

  upsertTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addProjectComment: (comment: Omit<Comment, "id" | "createdAt">) => void;

  upsertUser: (user: User) => void;
  deleteUser: (id: string) => void;

  upsertGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;

  upsertPhase: (phase: Phase) => void;
  deletePhase: (id: string) => void;

  attachFilesToTask: (
    taskId: string,
    files: FileList | File[],
    notes?: string
  ) => Promise<AttachmentFile[]>;

  linkExistingAttachment: (taskId: string, attachmentId: string) => void;
  unlinkAttachmentFromTask: (taskId: string, attachmentId: string) => void;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  updateAttachmentNotes: (attachmentId: string, notes: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function applyTaskPatch(task: Task, patch: Partial<Task>): Task {
  const next: Task = { ...task, ...patch };

  if (patch.startDate) {
    next.dueDate = addDays(
      next.startDate,
      Math.max(0, Number(next.durationDays) || 0)
    );
  }

  if (patch.dueDate) {
    next.durationDays = Math.max(0, diffDays(next.startDate, next.dueDate));
  }

  if (patch.durationDays !== undefined) {
    next.dueDate = addDays(
      next.startDate,
      Math.max(0, Number(patch.durationDays) || 0)
    );
  }

  if (patch.status === "Completed") {
    next.progress = 100;
  }

  if (patch.status === "Not Started") {
    next.progress = 0;
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(() => createDemoProject());
  const [directoryHandle, setDirectoryHandle] = useState<DirectoryHandle | null>(null);
  const [dirty, setDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Demo automation project loaded. Connect a local/SMB folder to save."
  );
  const [view, setView] = useState<"welcome" | "app">("welcome");
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(
    getRecentProjects()
  );
  const [lastProject, setLastProject] = useState<RecentProject | null>(
    getLastProject()
  );
  const [pickerBusy, setPickerBusy] = useState(false);
  const pickerLockRef = useRef(false);

  const acquirePickerLock = useCallback((): boolean => {
    if (pickerLockRef.current) {
      return false;
    }

    pickerLockRef.current = true;
    setPickerBusy(true);
    return true;
  }, []);

  const releasePickerLock = useCallback(() => {
    pickerLockRef.current = false;
    setPickerBusy(false);
  }, []);

  const mutate = useCallback((updater: (p: Project) => Project) => {
    setProject((prev) => updater(prev));
    setDirty(true);
  }, []);

  const updateProject = useCallback(
    (patch: Partial<Project>) => {
      mutate((prev) => ({
        ...prev,
        ...patch,
        settings: patch.settings
          ? { ...prev.settings, ...patch.settings }
          : prev.settings,
      }));
    },
    [mutate]
  );

  const updateSettings = useCallback(
    (patch: Partial<ProjectSettings>) => {
      mutate((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [mutate]
  );

  const upsertTask = useCallback(
    (task: Task) => {
      mutate((prev) => {
        const exists = prev.tasks.some((t) => t.id === task.id);

        return {
          ...prev,
          tasks: exists
            ? prev.tasks.map((t) =>
                t.id === task.id
                  ? { ...task, updatedAt: new Date().toISOString() }
                  : t
              )
            : [...prev.tasks, task],
        };
      });
    },
    [mutate]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      mutate((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? applyTaskPatch(t, patch) : t
        ),
      }));
    },
    [mutate]
  );

  const deleteTask = useCallback(
    (id: string) => {
      mutate((prev) => {
        const toDelete = collectDescendantIds(prev.tasks, id);

        return {
          ...prev,
          tasks: prev.tasks
            .filter((t) => !toDelete.has(t.id))
            .map((t) => ({
              ...t,
              dependencies: t.dependencies.filter((dep) => !toDelete.has(dep)),
            })),
        };
      });
    },
    [mutate]
  );

  const addProjectComment = useCallback(
    (comment: Omit<Comment, "id" | "createdAt">) => {
      mutate((prev) => ({
        ...prev,
        comments: [
          ...prev.comments,
          {
            ...comment,
            id: uid("comment"),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    [mutate]
  );

  const upsertUser = useCallback(
    (user: User) => {
      mutate((prev) => {
        const exists = prev.users.some((u) => u.id === user.id);

        return {
          ...prev,
          users: exists
            ? prev.users.map((u) => (u.id === user.id ? user : u))
            : [...prev.users, user],
        };
      });
    },
    [mutate]
  );

  const deleteUser = useCallback(
    (id: string) => {
      mutate((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== id),
        tasks: prev.tasks.map((t) => ({
          ...t,
          assigneeIds: t.assigneeIds.filter((a) => a !== id),
        })),
      }));
    },
    [mutate]
  );

  const upsertGroup = useCallback(
    (group: Group) => {
      mutate((prev) => {
        const exists = prev.groups.some((g) => g.id === group.id);

        return {
          ...prev,
          groups: exists
            ? prev.groups.map((g) => (g.id === group.id ? group : g))
            : [...prev.groups, group],
        };
      });
    },
    [mutate]
  );

  const deleteGroup = useCallback(
    (id: string) => {
      mutate((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== id),
        users: prev.users.map((u) =>
          u.groupId === id ? { ...u, groupId: "" } : u
        ),
        tasks: prev.tasks.map((t) => ({
          ...t,
          groupIds: t.groupIds.filter((g) => g !== id),
        })),
      }));
    },
    [mutate]
  );

  const upsertPhase = useCallback(
    (phase: Phase) => {
      mutate((prev) => {
        const exists = prev.phases.some((p) => p.id === phase.id);

        return {
          ...prev,
          phases: exists
            ? prev.phases.map((p) => (p.id === phase.id ? phase : p))
            : [...prev.phases, phase],
        };
      });
    },
    [mutate]
  );

  const deletePhase = useCallback(
    (id: string) => {
      if (
        !window.confirm(
          "Delete this phase? Tasks will remain but need a new phase assignment."
        )
      ) {
        return;
      }

      mutate((prev) => ({
        ...prev,
        phases: prev.phases.filter((p) => p.id !== id),
      }));
    },
    [mutate]
  );

  const registerProjectFolder = useCallback(
    async (handle: DirectoryHandle, proj: Project) => {
      const handleKey = `dir-${proj.id}-${handle.name}`;

      await saveDirectoryHandle(handleKey, handle);

      const entry: RecentProject = {
        id: proj.id,
        name: proj.name,
        customer: proj.customer,
        folderName: handle.name,
        handleKey,
        lastOpenedAt: new Date().toISOString(),
      };

      upsertRecentProject(entry);
      setRecentProjects(getRecentProjects());
      setLastProject(getLastProject());
    },
    []
  );

  const resumeProject = useCallback(
    async (handleKey: string): Promise<boolean> => {
      try {
        const handle = await getDirectoryHandle(handleKey);

        if (!handle) {
          alert(
            "Saved folder reference is no longer available. Please open the folder again."
          );
          return false;
        }

        const ok = await verifyPermission(handle, "readwrite");

        if (!ok) {
          alert("Permission to access the folder was denied. Please try again.");
          return false;
        }

        const raw = await readProjectFile(handle);

        if (!raw) {
          alert("No project_data.json found in the remembered folder.");
          return false;
        }

        const normalized = normalizeProject(raw);

        setProject(normalized);
        setDirectoryHandle(handle);
        setDirty(false);
        setView("app");
        setStatusMessage(`Resumed project from folder: ${handle.name}`);

        const entry: RecentProject = {
          id: normalized.id,
          name: normalized.name,
          customer: normalized.customer,
          folderName: handle.name,
          handleKey,
          lastOpenedAt: new Date().toISOString(),
        };

        upsertRecentProject(entry);
        setRecentProjects(getRecentProjects());
        setLastProject(getLastProject());

        return true;
      } catch (error: any) {
        const message = error?.message || String(error);
        setStatusMessage(`Resume failed: ${message}`);
        alert(message);
        return false;
      }
    },
    []
  );

  const resumeLastProject = useCallback(async (): Promise<boolean> => {
    const last = getLastProject();
    if (!last) return false;
    return resumeProject(last.handleKey);
  }, [resumeProject]);

  const forgetProject = useCallback((handleKey: string) => {
    removeRecentProject(handleKey);
    void removeDirectoryHandle(handleKey);
    setRecentProjects(getRecentProjects());
    setLastProject(getLastProject());
  }, []);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!directoryHandle) {
      setStatusMessage(
        "No folder connected. Use Export JSON fallback or click Open/Create Folder."
      );
      return false;
    }

    try {
      const savedAt = new Date().toISOString();

      const dataToSave: Project = {
        ...project,
        settings: {
          ...project.settings,
          lastSavedAt: savedAt,
          directoryName: directoryHandle.name,
        },
      };

      await writeProjectFile(directoryHandle, dataToSave);

      setProject(dataToSave);
      setDirty(false);
      setStatusMessage(`Saved to folder: ${directoryHandle.name}`);
      return true;
    } catch (error: any) {
      setStatusMessage(`Save failed: ${error?.message || String(error)}`);
      alert(`Save failed: ${error?.message || String(error)}`);
      return false;
    }
  }, [directoryHandle, project]);

  const openFolder = useCallback(async () => {
    if (!acquirePickerLock()) {
      setStatusMessage("A folder picker is already open. Please close it first.");
      return;
    }

    try {
      const handle = await pickDirectory("readwrite");
      const raw = await readProjectFile(handle);

      if (raw) {
        const normalized = normalizeProject(raw);
        setProject(normalized);
        setDirectoryHandle(handle);
        setDirty(false);
        setView("app");
        setStatusMessage(`Loaded project from folder: ${handle.name}`);
        await registerProjectFolder(handle, normalized);
      } else {
        const blank = createAutomationTemplateProject();
        setProject(blank);
        setDirectoryHandle(handle);
        setDirty(false);
        setView("app");
        setStatusMessage(
          `No project_data.json found in ${handle.name}. Click Save to create it.`
        );
        await registerProjectFolder(handle, blank);
      }
    } catch (error: any) {
      const message = error?.message || String(error);
      setStatusMessage(`Open folder failed: ${message}`);

      if (!message.toLowerCase().includes("cancel")) {
        alert(message);
      }
    } finally {
      releasePickerLock();
    }
  }, [acquirePickerLock, registerProjectFolder, releasePickerLock]);

  const createProjectFolder = useCallback(async () => {
    if (!acquirePickerLock()) {
      setStatusMessage("A folder picker is already open. Please close it first.");
      return;
    }

    try {
      const handle = await pickDirectory("readwrite");
      const existing = await readProjectFile(handle);

      if (
        existing &&
        !window.confirm(
          "This folder already contains project_data.json. Replace it with a new automation template?"
        )
      ) {
        return;
      }

      const blank = createAutomationTemplateProject();
      await writeProjectFile(handle, blank);

      setProject(blank);
      setDirectoryHandle(handle);
      setDirty(false);
      setView("app");
      setStatusMessage(`Created new project file in folder: ${handle.name}`);
      await registerProjectFolder(handle, blank);
    } catch (error: any) {
      const message = error?.message || String(error);
      setStatusMessage(`Create folder failed: ${message}`);

      if (!message.toLowerCase().includes("cancel")) {
        alert(message);
      }
    } finally {
      releasePickerLock();
    }
  }, [acquirePickerLock, registerProjectFolder, releasePickerLock]);

  const exportJson = useCallback(() => {
    const safeName =
      project.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80) ||
      "automation_project";

    downloadJson(`${safeName}.json`, project);
    setStatusMessage("Exported project JSON.");
  }, [project]);

  const importJsonFile = useCallback(async (file: File) => {
    try {
      const raw = await readJsonFile(file);
      const normalized = normalizeProject(raw);

      setProject(normalized);
      setDirty(true);
      setView("app");
      setStatusMessage(
        "Imported JSON into memory. Connect a folder and Save to persist."
      );
    } catch (error: any) {
      setStatusMessage(`Import failed: ${error?.message || String(error)}`);
      alert(`Import failed: ${error?.message || String(error)}`);
    }
  }, []);

  const loadDemo = useCallback(() => {
    setProject(createDemoProject());
    setDirectoryHandle(null);
    setDirty(false);
    setView("app");
    setStatusMessage("Demo automation project loaded. Connect a folder to save.");
  }, []);

  const newFromTemplate = useCallback(() => {
    setProject(createAutomationTemplateProject());
    setDirectoryHandle(null);
    setDirty(true);
    setView("app");
    setStatusMessage(
      "New automation template created in memory. Open/Create a folder and Save."
    );
  }, []);

  const attachFilesToTask = useCallback(
    async (
      taskId: string,
      files: FileList | File[],
      notes = ""
    ): Promise<AttachmentFile[]> => {
      if (!directoryHandle) {
        alert("Connect a project folder first to store attachments on disk.");
        return [];
      }

      const fileArr = Array.from(files);
      const newAttachments: AttachmentFile[] = [];

      for (const file of fileArr) {
        const att = await copyFileIntoAttachments(
          directoryHandle,
          file,
          notes,
          project.projectManager || "Coordinator"
        );

        newAttachments.push(att);
      }

      mutate((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;

        const existingIds = new Set(task.attachmentIds || []);
        const idsToAdd = newAttachments
          .map((a) => a.id)
          .filter((id) => !existingIds.has(id));

        return {
          ...prev,
          attachmentRegistry: [
            ...prev.attachmentRegistry,
            ...newAttachments,
          ],
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  attachmentIds: [...(t.attachmentIds || []), ...idsToAdd],
                }
              : t
          ),
        };
      });

      return newAttachments;
    },
    [directoryHandle, mutate, project.projectManager]
  );

  const linkExistingAttachment = useCallback(
    (taskId: string, attachmentId: string) => {
      mutate((prev) => {
        const exists = prev.attachmentRegistry.some(
          (a) => a.id === attachmentId
        );

        if (!exists) return prev;

        return {
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id !== taskId) return t;

            const ids = t.attachmentIds || [];
            if (ids.includes(attachmentId)) return t;

            return {
              ...t,
              attachmentIds: [...ids, attachmentId],
            };
          }),
        };
      });
    },
    [mutate]
  );

  const unlinkAttachmentFromTask = useCallback(
    (taskId: string, attachmentId: string) => {
      mutate((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                attachmentIds: (t.attachmentIds || []).filter(
                  (id) => id !== attachmentId
                ),
              }
            : t
        ),
      }));
    },
    [mutate]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      if (!directoryHandle) return;

      const att = project.attachmentRegistry.find(
        (a) => a.id === attachmentId
      );

      if (!att) return;

      if (
        !window.confirm(
          `Permanently delete "${att.fileName}" from disk and remove all references?`
        )
      ) {
        return;
      }

      await deleteAttachmentFile(directoryHandle, att);

      mutate((prev) => ({
        ...prev,
        attachmentRegistry: prev.attachmentRegistry.filter(
          (a) => a.id !== attachmentId
        ),
        tasks: prev.tasks.map((t) => ({
          ...t,
          attachmentIds: (t.attachmentIds || []).filter(
            (id) => id !== attachmentId
          ),
        })),
      }));
    },
    [directoryHandle, mutate, project.attachmentRegistry]
  );

  const updateAttachmentNotes = useCallback(
    (attachmentId: string, notes: string) => {
      mutate((prev) => ({
        ...prev,
        attachmentRegistry: prev.attachmentRegistry.map((a) =>
          a.id === attachmentId ? { ...a, notes } : a
        ),
      }));
    },
    [mutate]
  );

  useEffect(() => {
    if (!dirty || !directoryHandle || !project.settings.autoSave) return;

    const timer = setTimeout(() => {
      void saveNow();
    }, 1200);

    return () => clearTimeout(timer);
  }, [dirty, directoryHandle, project.settings.autoSave, saveNow]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      directoryHandle,
      dirty,
      statusMessage,
      view,
      setView,
      recentProjects,
      lastProject,
      pickerBusy,
      openFolder,
      createProjectFolder,
      saveNow,
      exportJson,
      importJsonFile,
      loadDemo,
      newFromTemplate,
      resumeLastProject,
      resumeProject,
      forgetProject,
      updateProject,
      updateSettings,
      upsertTask,
      updateTask,
      deleteTask,
      addProjectComment,
      upsertUser,
      deleteUser,
      upsertGroup,
      deleteGroup,
      upsertPhase,
      deletePhase,
      attachFilesToTask,
      linkExistingAttachment,
      unlinkAttachmentFromTask,
      deleteAttachment,
      updateAttachmentNotes,
    }),
    [
      project,
      directoryHandle,
      dirty,
      statusMessage,
      view,
      recentProjects,
      lastProject,
      pickerBusy,
      openFolder,
      createProjectFolder,
      saveNow,
      exportJson,
      importJsonFile,
      loadDemo,
      newFromTemplate,
      resumeLastProject,
      resumeProject,
      forgetProject,
      updateProject,
      updateSettings,
      upsertTask,
      updateTask,
      deleteTask,
      addProjectComment,
      upsertUser,
      deleteUser,
      upsertGroup,
      deleteGroup,
      upsertPhase,
      deletePhase,
      attachFilesToTask,
      linkExistingAttachment,
      unlinkAttachmentFromTask,
      deleteAttachment,
      updateAttachmentNotes,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);

  if (!ctx) {
    throw new Error("useProject must be used inside ProjectProvider");
  }

  return ctx;
}