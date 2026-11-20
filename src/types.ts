export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Blocked / On Hold"
  | "Pending Review"
  | "Completed";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export const TASK_STATUSES: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Blocked / On Hold",
  "Pending Review",
  "Completed",
];

export const TASK_PRIORITIES: TaskPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

export interface Group {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  groupId: string;
  email: string;
  active: boolean;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  order: number;
  startDate?: string;
  dueDate?: string;
}

export interface Comment {
  id: string;
  taskId?: string | null;
  author: string;
  text: string;
  type: "Note" | "Progress" | "Issue" | "Decision";
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  relativePath: string;
  kind?: string;
  addedAt: string;
}

export interface AttachmentFile {
  id: string;
  fileName: string;
  storedPath: string;
  fileSize: number;
  mimeType: string;
  uploadedDate: string;
  notes: string;
  addedBy: string;
}

export interface Task {
  id: string;
  phaseId: string;
  parentId?: string | null;
  title: string;
  description: string;
  assigneeIds: string[];
  groupIds: string[];
  startDate: string;
  dueDate: string;
  durationDays: number;
  status: TaskStatus;
  progress: number;
  priority: TaskPriority;
  dependencies: string[];
  comments: Comment[];
  attachments: Attachment[];
  attachmentIds: string[];
  isMilestone: boolean;
  milestoneLabel?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  autoSave: boolean;
  lastSavedAt?: string;
  directoryName?: string;
}

export interface Project {
  id: string;
  name: string;
  customer: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  phases: Phase[];
  tasks: Task[];
  users: User[];
  groups: Group[];
  comments: Comment[];
  attachmentRegistry: AttachmentFile[];
  settings: ProjectSettings;
}

export interface TaskEditorState {
  task?: Task;
  phaseId: string;
  parentId?: string | null;
}