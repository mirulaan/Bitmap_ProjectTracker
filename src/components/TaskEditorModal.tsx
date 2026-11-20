import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Trash2,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { collectDescendantIds, uid } from "../lib/project";
import { addDays, diffDays, formatDisplay, todayISO } from "../lib/date";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type AttachmentFile,
  type Comment,
  type Task,
  type TaskEditorState,
  type TaskPriority,
  type TaskStatus,
} from "../types";
import {
  readAttachmentBlob,
  isPreviewable,
  formatFileSize,
} from "../lib/attachments";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "./ui";

export default function TaskEditorModal({
  state,
  onClose,
}: {
  state: TaskEditorState;
  onClose: () => void;
}) {
  const {
    project,
    directoryHandle,
    upsertTask,
    deleteTask,
    attachFilesToTask,
    linkExistingAttachment,
    unlinkAttachmentFromTask,
    deleteAttachment,
  } = useProject();

  const isNew = !state.task;

  const initialTask: Task = useMemo(() => {
    if (state.task) {
      return {
        ...state.task,
        attachmentIds: state.task.attachmentIds || [],
      };
    }

    const startDate = todayISO();
    const durationDays = 5;

    return {
      id: uid("task"),
      phaseId: state.phaseId,
      parentId: state.parentId ?? null,
      title: "",
      description: "",
      assigneeIds: [],
      groupIds: [],
      startDate,
      dueDate: addDays(startDate, durationDays),
      durationDays,
      status: "Not Started",
      progress: 0,
      priority: "Medium",
      dependencies: [],
      comments: [],
      attachments: [],
      attachmentIds: [],
      isMilestone: false,
      milestoneLabel: "",
      internalNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [state]);

  const [form, setForm] = useState<Task>(initialTask);

  const [commentAuthor, setCommentAuthor] = useState(
    project.projectManager || "Coordinator"
  );
  const [commentType, setCommentType] = useState<Comment["type"]>("Progress");
  const [commentText, setCommentText] = useState("");

  const [viewingAttachment, setViewingAttachment] =
    useState<AttachmentFile | null>(null);
  const [viewingBlobUrl, setViewingBlobUrl] = useState<string | null>(null);
  const [viewingText, setViewingText] = useState<string | null>(null);
  const [viewingError, setViewingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewingBlobUrlRef = useRef<string | null>(null);

  const bannedIds = useMemo(
    () => collectDescendantIds(project.tasks, form.id),
    [project.tasks, form.id]
  );

  const dependencyOptions = useMemo(
    () => project.tasks.filter((t) => !bannedIds.has(t.id)),
    [project.tasks, bannedIds]
  );

  const parentOptions = useMemo(
    () =>
      project.tasks.filter(
        (t) => t.phaseId === form.phaseId && !bannedIds.has(t.id)
      ),
    [project.tasks, form.phaseId, bannedIds]
  );

  const attachmentRegistry = project.attachmentRegistry || [];

  const attachmentsById = useMemo(
    () => new Map(attachmentRegistry.map((a) => [a.id, a])),
    [attachmentRegistry]
  );

  const taskAttachments = useMemo(
    () =>
      (form.attachmentIds || [])
        .map((id) => attachmentsById.get(id))
        .filter((a): a is AttachmentFile => !!a),
    [form.attachmentIds, attachmentsById]
  );

  const unlinkedAttachments = useMemo(
    () =>
      attachmentRegistry.filter(
        (a) => !(form.attachmentIds || []).includes(a.id)
      ),
    [attachmentRegistry, form.attachmentIds]
  );

  const setBlobUrl = (url: string | null) => {
    if (viewingBlobUrlRef.current) {
      URL.revokeObjectURL(viewingBlobUrlRef.current);
    }

    viewingBlobUrlRef.current = url;
    setViewingBlobUrl(url);
  };

  useEffect(() => {
    return () => {
      if (viewingBlobUrlRef.current) {
        URL.revokeObjectURL(viewingBlobUrlRef.current);
      }
    };
  }, []);

  const setField = <K extends keyof Task>(key: K, value: Task[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "startDate") {
        next.dueDate = addDays(
          next.startDate,
          Math.max(0, Number(next.durationDays) || 0)
        );
      }

      if (key === "durationDays") {
        next.dueDate = addDays(
          next.startDate,
          Math.max(0, Number(value) || 0)
        );
      }

      if (key === "dueDate") {
        next.durationDays = Math.max(
          0,
          diffDays(next.startDate, String(value))
        );
      }

      if (key === "status") {
        if (value === "Completed") next.progress = 100;
        if (value === "Not Started") next.progress = 0;
      }

      return next;
    });
  };

  const toggleArrayField = (
    key: "assigneeIds" | "groupIds",
    id: string
  ) => {
    setForm((prev) => {
      const arr = prev[key];
      const nextArr = arr.includes(id)
        ? arr.filter((x) => x !== id)
        : [...arr, id];

      return { ...prev, [key]: nextArr };
    });
  };

  const addLocalComment = () => {
    if (!commentText.trim()) return;

    const c: Comment = {
      id: uid("comment"),
      taskId: form.id,
      author: commentAuthor.trim() || "Coordinator",
      text: commentText.trim(),
      type: commentType,
      createdAt: new Date().toISOString(),
    };

    setForm((prev) => ({
      ...prev,
      comments: [...prev.comments, c],
    }));

    setCommentText("");
  };

  const save = () => {
    if (!form.title.trim()) {
      alert("Task title is required.");
      return;
    }

    const task: Task = {
      ...form,
      title: form.title.trim(),
      dueDate:
        form.dueDate ||
        addDays(form.startDate, Math.max(0, form.durationDays)),
      durationDays:
        form.durationDays ??
        Math.max(0, diffDays(form.startDate, form.dueDate)),
      attachmentIds: form.attachmentIds || [],
      updatedAt: new Date().toISOString(),
    };

    upsertTask(task);
    onClose();
  };

  const remove = () => {
    if (!state.task) return;

    if (window.confirm(`Delete "${form.title}" and all sub-tasks?`)) {
      deleteTask(form.id);
      onClose();
    }
  };

  const openAttachmentViewer = async (att: AttachmentFile) => {
    if (!directoryHandle) {
      alert("Connect a project folder to preview attachments.");
      return;
    }

    setBlobUrl(null);
    setViewingAttachment(att);
    setViewingText(null);
    setViewingError(null);

    try {
      const blob = await readAttachmentBlob(directoryHandle, att);
      const kind = isPreviewable(att.mimeType);

      if (kind === "text") {
        const text = await blob.text();
        setViewingText(text);
      } else if (kind) {
        setBlobUrl(URL.createObjectURL(blob));
      }
    } catch (e: any) {
      setViewingError(e?.message || String(e));
    }
  };

  const closeAttachmentViewer = () => {
    setBlobUrl(null);
    setViewingAttachment(null);
    setViewingText(null);
    setViewingError(null);
  };

  const downloadAttachment = async (att: AttachmentFile) => {
    if (!directoryHandle) {
      alert("Connect a project folder to download attachments.");
      return;
    }

    try {
      const blob = await readAttachmentBlob(directoryHandle, att);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Download failed: ${e?.message || String(e)}`);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!directoryHandle) {
      alert("Connect a project folder to store attachments on disk.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (isNew) {
      if (!form.title.trim()) {
        alert("Please give the task a title before attaching files.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const taskToSave: Task = {
        ...form,
        title: form.title.trim(),
        attachmentIds: form.attachmentIds || [],
        updatedAt: new Date().toISOString(),
      };

      upsertTask(taskToSave);
    }

    try {
      const added = await attachFilesToTask(form.id, files);

      if (added.length > 0) {
        setForm((prev) => {
          const merged = new Set([
            ...(prev.attachmentIds || []),
            ...added.map((a) => a.id),
          ]);

          return {
            ...prev,
            attachmentIds: Array.from(merged),
          };
        });
      }
    } catch (e: any) {
      alert(`Upload failed: ${e?.message || String(e)}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLinkExisting = (attachmentId: string) => {
    if (!attachmentId) return;

    linkExistingAttachment(form.id, attachmentId);

    setForm((prev) => {
      const ids = prev.attachmentIds || [];
      if (ids.includes(attachmentId)) return prev;

      return {
        ...prev,
        attachmentIds: [...ids, attachmentId],
      };
    });
  };

  const handleUnlink = (attachmentId: string) => {
    unlinkAttachmentFromTask(form.id, attachmentId);

    setForm((prev) => ({
      ...prev,
      attachmentIds: (prev.attachmentIds || []).filter(
        (id) => id !== attachmentId
      ),
    }));
  };

  const handleDeleteAttachment = async (att: AttachmentFile) => {
    if (!directoryHandle) {
      alert("Connect a project folder to delete files from disk.");
      return;
    }

    if (
      !window.confirm(
        `Permanently delete "${att.fileName}" from disk and remove it from all tasks?`
      )
    ) {
      return;
    }

    await deleteAttachment(att.id);

    setForm((prev) => ({
      ...prev,
      attachmentIds: (prev.attachmentIds || []).filter(
        (id) => id !== att.id
      ),
    }));
  };

  const viewingKind = viewingAttachment
    ? isPreviewable(viewingAttachment.mimeType)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print">
      <Card className="w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold">
            {isNew ? "Create Task" : "Edit Task"}
          </h2>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Task ID" className="md:col-span-1">
              <Input value={form.id} readOnly className="bg-slate-50" />
            </Field>

            <Field label="Title" className="md:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Release electrical schematics"
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Scope, acceptance criteria, links to drawings, vendor info, etc."
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Phase">
              <Select
                value={form.phaseId}
                onChange={(e) => setField("phaseId", e.target.value)}
              >
                {[...project.phases]
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.order}. {p.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Parent Task">
              <Select
                value={form.parentId ?? ""}
                onChange={(e) =>
                  setField("parentId", e.target.value || null)
                }
              >
                <option value="">None / Root Task</option>
                {parentOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Milestone">
              <label className="flex h-[38px] items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.isMilestone}
                  onChange={(e) => setField("isMilestone", e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Mark as milestone
              </label>
            </Field>
          </div>

          {form.isMilestone && (
            <Field label="Milestone Label">
              <Input
                value={form.milestoneLabel || ""}
                onChange={(e) => setField("milestoneLabel", e.target.value)}
                placeholder="e.g. FAT, Onsite Delivery, SAT, Final Buyoff"
              />
            </Field>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Start Date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </Field>

            <Field label="Duration (days)">
              <Input
                type="number"
                min={0}
                value={form.durationDays}
                onChange={(e) =>
                  setField("durationDays", Number(e.target.value))
                }
              />
            </Field>

            <Field label="Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setField("dueDate", e.target.value)}
              />
            </Field>

            <Field label="Computed Duration">
              <Input
                readOnly
                value={`${Math.max(0, diffDays(form.startDate, form.dueDate))} days`}
                className="bg-slate-50"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  setField("status", e.target.value as TaskStatus)
                }
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) =>
                  setField("priority", e.target.value as TaskPriority)
                }
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Progress %" className="md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) =>
                    setField("progress", Number(e.target.value))
                  }
                  className="flex-1 accent-blue-600"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) =>
                    setField("progress", Number(e.target.value))
                  }
                  className="w-24"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Assigned Users">
              <div className="max-h-40 overflow-y-auto rounded-md border border-slate-300 p-2">
                {project.users.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No users defined. Add users in Setup.
                  </p>
                ) : (
                  project.users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.assigneeIds.includes(u.id)}
                        onChange={() => toggleArrayField("assigneeIds", u.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {u.name}
                      <span className="text-xs text-slate-500">
                        ({u.role})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </Field>

            <Field label="Assigned Groups / Departments">
              <div className="max-h-40 overflow-y-auto rounded-md border border-slate-300 p-2">
                {project.groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.groupIds.includes(g.id)}
                      onChange={() => toggleArrayField("groupIds", g.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Dependencies">
            <Select
              multiple
              value={form.dependencies}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions,
                  (o) => o.value
                );
                setField("dependencies", values);
              }}
              className="min-h-[120px]"
            >
              {dependencyOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({formatDisplay(t.dueDate)})
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-500">
              Hold Ctrl / Cmd to select multiple predecessor tasks.
            </p>
          </Field>

          <Field label="Internal Notes / Engineering Detail">
            <Textarea
              value={form.internalNotes || ""}
              onChange={(e) => setField("internalNotes", e.target.value)}
              placeholder="Internal notes that should not appear in executive/client reports."
            />
          </Field>

          <Card className="p-3 bg-slate-50">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" />
              Comments / Activity Log
            </h3>

            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {form.comments.length === 0 ? (
                <p className="text-xs text-slate-500">No comments yet.</p>
              ) : (
                form.comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-slate-200 bg-white p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm">{c.text}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {c.author} •{" "}
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <Badge
                        color={
                          c.type === "Issue"
                            ? "red"
                            : c.type === "Decision"
                              ? "purple"
                              : c.type === "Progress"
                                ? "blue"
                                : "slate"
                        }
                      >
                        {c.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Author"
              />

              <Select
                value={commentType}
                onChange={(e) =>
                  setCommentType(e.target.value as Comment["type"])
                }
              >
                <option value="Note">Note</option>
                <option value="Progress">Progress</option>
                <option value="Issue">Issue</option>
                <option value="Decision">Decision</option>
              </Select>

              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Log progress, issue, decision..."
                className="md:col-span-1"
              />

              <Button onClick={addLocalComment}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </Card>

          <Card className="p-3 bg-slate-50">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Paperclip className="h-4 w-4" />
              Attachments ({taskAttachments.length})
            </h3>

            {!directoryHandle && (
              <p className="text-xs text-amber-700 mb-2">
                Connect a project folder to upload, preview, download, or
                delete files from disk. You can still link files already in
                the project registry.
              </p>
            )}

            {isNew && (
              <p className="text-xs text-slate-500 mb-2">
                Uploading a new file on an unsaved task will save the task
                first.
              </p>
            )}

            <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
              {taskAttachments.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No attachments linked to this task.
                </p>
              ) : (
                taskAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2"
                  >
                    <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {att.fileName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formatFileSize(att.fileSize)} • {att.mimeType}
                        {att.notes && ` • ${att.notes}`}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      title="Preview"
                      onClick={() => openAttachmentViewer(att)}
                      disabled={!directoryHandle}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      title="Download"
                      onClick={() => downloadAttachment(att)}
                      disabled={!directoryHandle}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      title="Unlink from this task (file stays in project)"
                      onClick={() => handleUnlink(att.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete from disk and all tasks"
                      onClick={() => handleDeleteAttachment(att)}
                      disabled={!directoryHandle}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!directoryHandle}
              >
                <Upload className="h-4 w-4" />
                Upload New File
              </Button>

              {unlinkedAttachments.length > 0 && (
                <Select
                  className="min-w-[220px] text-xs"
                  value=""
                  onChange={(e) => {
                    handleLinkExisting(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">Link existing project file…</option>
                  {unlinkedAttachments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fileName} ({formatFileSize(a.fileSize)})
                    </option>
                  ))}
                </Select>
              )}

              <p className="text-[11px] text-slate-500">
                Uploaded files are copied to{" "}
                <code>attachments/</code> inside your project folder. Linking
                reuses the same file across tasks.
              </p>
            </div>
          </Card>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
          <div>
            {!isNew && (
              <Button variant="danger" onClick={remove}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={save}>
              <Save className="h-4 w-4" />
              Save Task
            </Button>
          </div>
        </div>
      </Card>

      {viewingAttachment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 no-print">
          <Card className="w-full max-w-5xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {viewingAttachment.fileName}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  {viewingAttachment.mimeType} •{" "}
                  {formatFileSize(viewingAttachment.fileSize)}
                  {viewingAttachment.notes &&
                    ` • ${viewingAttachment.notes}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {viewingBlobUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(viewingBlobUrl, "_blank")}
                  >
                    New Tab
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadAttachment(viewingAttachment)}
                  disabled={!directoryHandle}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>

                <button
                  onClick={closeAttachmentViewer}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {viewingError && (
                <div className="text-sm text-red-700">
                  Preview failed: {viewingError}
                </div>
              )}

              {!viewingError && viewingKind === "pdf" && viewingBlobUrl && (
                <iframe
                  src={viewingBlobUrl}
                  title={viewingAttachment.fileName}
                  className="w-full h-[70vh] border border-slate-200 bg-white"
                />
              )}

              {!viewingError &&
                viewingKind === "image" &&
                viewingBlobUrl && (
                  <div className="flex items-center justify-center">
                    <img
                      src={viewingBlobUrl}
                      alt={viewingAttachment.fileName}
                      className="max-w-full max-h-[70vh] border border-slate-200 bg-white"
                    />
                  </div>
                )}

              {!viewingError &&
                viewingKind === "text" &&
                viewingText !== null && (
                  <pre className="text-xs bg-white border border-slate-200 rounded p-3 overflow-auto max-h-[70vh] whitespace-pre-wrap break-words">
                    {viewingText}
                  </pre>
                )}

              {!viewingError && !viewingKind && (
                <div className="text-center py-12 text-sm text-slate-600">
                  <p>Preview not available for this file type.</p>
                  <p className="mt-2">
                    Click <strong>Download</strong> to save a local copy.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}