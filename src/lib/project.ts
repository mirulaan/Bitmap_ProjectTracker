import type {
  Attachment,
  AttachmentFile,
  Comment,
  Group,
  Phase,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "../types";
import { TASK_PRIORITIES, TASK_STATUSES } from "../types";
import { addDays, diffDays, isDueThisWeek, isOverdue, todayISO } from "./date";

export function uid(prefix = "id"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function clampPercent(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function defaultGroups(): Group[] {
  return [
    { id: "group-mechanical", name: "Mechanical" },
    { id: "group-electrical", name: "Electrical" },
    { id: "group-plc", name: "PLC Team" },
    { id: "group-vision", name: "Vision / Software Team" },
    { id: "group-project-management", name: "Project Management" },
    { id: "group-quality", name: "Quality / Commissioning" },
  ];
}

export function defaultPhases(): Phase[] {
  return [
    {
      id: "phase-1",
      name: "System Design & Procurement",
      description:
        "Electrical schematics, mechanical BOM, long-lead hardware such as cameras, PLCs, actuators, safety components.",
      order: 1,
    },
    {
      id: "phase-2",
      name: "Panel Wiring & Mechanical Assembly",
      description:
        "Control panel build, vision rig assembly, sensor mounting, mechanical integration.",
      order: 2,
    },
    {
      id: "phase-3",
      name: "Software & PLC Development",
      description:
        "PLC ladder / structured text logic, HMI screens, PC vision/control software, protocol integration.",
      order: 3,
    },
    {
      id: "phase-4",
      name: "Internal Integration & FAT",
      description:
        "Dry run, cycle time verification, debugging, internal sign-off, Factory Acceptance Test.",
      order: 4,
    },
    {
      id: "phase-5",
      name: "Onsite Installation & Commissioning",
      description:
        "Delivery, mechanical/electrical hookup at client site, safety checks, commissioning support.",
      order: 5,
    },
    {
      id: "phase-6",
      name: "SAT & Final Buyoff",
      description:
        "Production run validation, operator training, documentation handover, formal buyoff sign-off.",
      order: 6,
    },
  ];
}

export function createAutomationTemplateProject(): Project {
  const today = todayISO();

  return {
    id: uid("project"),
    name: "New Automation Project",
    customer: "",
    projectManager: "",
    startDate: today,
    endDate: addDays(today, 120),
    phases: defaultPhases(),
    tasks: [],
    users: [],
    groups: defaultGroups(),
    comments: [],
    attachmentRegistry: [],
    settings: {
      autoSave: false,
    },
  };
}

function normalizeAttachment(input: any): AttachmentFile {
  return {
    id: input?.id || uid("att"),
    fileName: input?.fileName || "unnamed",
    storedPath: input?.storedPath || "",
    fileSize: Number(input?.fileSize) || 0,
    mimeType: input?.mimeType || "application/octet-stream",
    uploadedDate: input?.uploadedDate || new Date().toISOString(),
    notes: input?.notes || "",
    addedBy: input?.addedBy || "",
  };
}

function normalizeLegacyAttachment(input: any): Attachment {
  return {
    id: input?.id || uid("attachment"),
    name: input?.name || "Unnamed attachment",
    relativePath: input?.relativePath || "",
    kind: input?.kind,
    addedAt: input?.addedAt || new Date().toISOString(),
  };
}

function normalizeComment(input: any): Comment {
  return {
    id: input?.id || uid("comment"),
    taskId: input?.taskId ?? null,
    author: input?.author || "Unknown",
    text: input?.text || "",
    type: ["Note", "Progress", "Issue", "Decision"].includes(input?.type)
      ? input.type
      : "Note",
    createdAt: input?.createdAt || new Date().toISOString(),
  };
}

function normalizeTask(input: any): Task {
  const startDate = input?.startDate || todayISO();
  const dueDate =
    input?.dueDate ||
    addDays(startDate, Number.isFinite(input?.durationDays) ? input.durationDays : 1);

  const durationDays = Number.isFinite(input?.durationDays)
    ? input.durationDays
    : Math.max(0, diffDays(startDate, dueDate));

  const status: TaskStatus = TASK_STATUSES.includes(input?.status)
    ? input.status
    : "Not Started";

  const priority: TaskPriority = TASK_PRIORITIES.includes(input?.priority)
    ? input.priority
    : "Medium";

  return {
    id: input?.id || uid("task"),
    phaseId: input?.phaseId || "phase-1",
    parentId: input?.parentId ?? null,
    title: input?.title || "Untitled Task",
    description: input?.description || "",
    assigneeIds: Array.isArray(input?.assigneeIds) ? input.assigneeIds : [],
    groupIds: Array.isArray(input?.groupIds) ? input.groupIds : [],
    startDate,
    dueDate,
    durationDays,
    status,
    progress: clampPercent(input?.progress),
    priority,
    dependencies: Array.isArray(input?.dependencies) ? input.dependencies : [],
    comments: Array.isArray(input?.comments)
      ? input.comments.map(normalizeComment)
      : [],
    attachments: Array.isArray(input?.attachments)
      ? input.attachments.map(normalizeLegacyAttachment)
      : [],
    attachmentIds: Array.isArray(input?.attachmentIds)
      ? input.attachmentIds.filter((x: any) => typeof x === "string")
      : [],
    isMilestone: Boolean(input?.isMilestone),
    milestoneLabel: input?.milestoneLabel,
    internalNotes: input?.internalNotes || "",
    createdAt: input?.createdAt || new Date().toISOString(),
    updatedAt: input?.updatedAt || new Date().toISOString(),
  };
}

export function normalizeProject(input: any): Project {
  const base = createAutomationTemplateProject();

  return {
    ...base,
    ...input,
    id: input?.id || base.id,
    name: input?.name || "Untitled Automation Project",
    customer: input?.customer || "",
    projectManager: input?.projectManager || "",
    startDate: input?.startDate || base.startDate,
    endDate: input?.endDate || base.endDate,
    phases:
      Array.isArray(input?.phases) && input.phases.length > 0
        ? input.phases.map((p: any, idx: number) => ({
            id: p?.id || uid("phase"),
            name: p?.name || `Phase ${idx + 1}`,
            description: p?.description || "",
            order: Number.isFinite(p?.order) ? p.order : idx + 1,
            startDate: p?.startDate,
            dueDate: p?.dueDate,
          }))
        : defaultPhases(),
    groups:
      Array.isArray(input?.groups) && input.groups.length > 0
        ? input.groups.map((g: any) => ({
            id: g?.id || uid("group"),
            name: g?.name || "Unnamed Group",
          }))
        : defaultGroups(),
    users: Array.isArray(input?.users)
      ? input.users.map((u: any) => ({
          id: u?.id || uid("user"),
          name: u?.name || "Unnamed User",
          role: u?.role || "",
          groupId: u?.groupId || "",
          email: u?.email || "",
          active: u?.active !== false,
        }))
      : [],
    tasks: Array.isArray(input?.tasks) ? input.tasks.map(normalizeTask) : [],
    comments: Array.isArray(input?.comments)
      ? input.comments.map(normalizeComment)
      : [],
    attachmentRegistry: Array.isArray(input?.attachmentRegistry)
      ? input.attachmentRegistry.map(normalizeAttachment)
      : [],
    settings: {
      autoSave: Boolean(input?.settings?.autoSave),
      lastSavedAt: input?.settings?.lastSavedAt,
      directoryName: input?.settings?.directoryName,
    },
  };
}

export function buildChildrenMap(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = task.parentId || "__root__";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }

  return map;
}

export function buildProgressMap(tasks: Task[]): Map<string, number> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const childrenMap = buildChildrenMap(tasks);
  const cache = new Map<string, number>();
  const visiting = new Set<string>();

  function calc(id: string): number {
    if (cache.has(id)) return cache.get(id)!;
    if (visiting.has(id)) return 0;

    visiting.add(id);

    const task = byId.get(id);
    if (!task) {
      visiting.delete(id);
      return 0;
    }

    const children = childrenMap.get(id) || [];

    let result: number;

    if (children.length === 0) {
      result = clampPercent(task.progress);
    } else {
      let totalWeight = 0;
      let weightedSum = 0;

      for (const child of children) {
        const childProgress = calc(child.id);
        const weight = Math.max(1, Number(child.durationDays) || 1);
        weightedSum += childProgress * weight;
        totalWeight += weight;
      }

      result = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    cache.set(id, result);
    visiting.delete(id);
    return result;
  }

  for (const task of tasks) {
    calc(task.id);
  }

  return cache;
}

export function collectDescendantIds(tasks: Task[], rootId: string): Set<string> {
  const childrenMap = buildChildrenMap(tasks);
  const result = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const id = stack.pop()!;
    result.add(id);

    const children = childrenMap.get(id) || [];
    for (const child of children) {
      stack.push(child.id);
    }
  }

  return result;
}

export interface DerivedStats {
  overall: number;
  taskProgress: Map<string, number>;
  phaseProgress: Map<string, number>;
  overdue: Task[];
  dueThisWeek: Task[];
  blocked: Task[];
  milestones: Task[];
  groupProgress: {
    group: Group;
    progress: number;
    taskCount: number;
  }[];
}

export function deriveStats(project: Project): DerivedStats {
  const tasks = project.tasks;
  const taskProgress = buildProgressMap(tasks);

  const rootTasks = tasks.filter((t) => !t.parentId);

  let overallWeight = 0;
  let overallSum = 0;

  for (const task of rootTasks) {
    const weight = Math.max(1, Number(task.durationDays) || 1);
    overallSum += (taskProgress.get(task.id) || 0) * weight;
    overallWeight += weight;
  }

  const overall =
    overallWeight > 0
      ? overallSum / overallWeight
      : tasks.length > 0
        ? tasks.reduce((sum, t) => sum + (taskProgress.get(t.id) || 0), 0) /
          tasks.length
        : 0;

  const phaseProgress = new Map<string, number>();

  for (const phase of project.phases) {
    const phaseRootTasks = rootTasks.filter((t) => t.phaseId === phase.id);

    if (phaseRootTasks.length > 0) {
      let weight = 0;
      let sum = 0;

      for (const task of phaseRootTasks) {
        const w = Math.max(1, Number(task.durationDays) || 1);
        sum += (taskProgress.get(task.id) || 0) * w;
        weight += w;
      }

      phaseProgress.set(phase.id, weight > 0 ? sum / weight : 0);
    } else {
      const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
      const avg =
        phaseTasks.length > 0
          ? phaseTasks.reduce(
              (sum, t) => sum + (taskProgress.get(t.id) || 0),
              0
            ) / phaseTasks.length
          : 0;

      phaseProgress.set(phase.id, avg);
    }
  }

  const overdue = tasks
    .filter(isOverdue)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const dueThisWeek = tasks
    .filter(isDueThisWeek)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const blocked = tasks.filter((t) => t.status === "Blocked / On Hold");

  const milestones = tasks
    .filter((t) => t.isMilestone)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const groupProgress = project.groups.map((group) => {
    const groupTasks = tasks.filter((t) => t.groupIds.includes(group.id));

    let weight = 0;
    let sum = 0;

    for (const task of groupTasks) {
      const w = Math.max(1, Number(task.durationDays) || 1);
      sum += (taskProgress.get(task.id) || 0) * w;
      weight += w;
    }

    return {
      group,
      progress: weight > 0 ? sum / weight : 0,
      taskCount: groupTasks.length,
    };
  });

  return {
    overall,
    taskProgress,
    phaseProgress,
    overdue,
    dueThisWeek,
    blocked,
    milestones,
    groupProgress,
  };
}

export function createDemoProject(): Project {
  const today = todayISO();
  const d = (offset: number) => addDays(today, offset);

  const groups: Group[] = defaultGroups();

  const users: User[] = [
    {
      id: "user-alice",
      name: "Alice Chen",
      role: "Project Coordinator",
      groupId: "group-project-management",
      email: "alice@example.com",
      active: true,
    },
    {
      id: "user-bob",
      name: "Bob Martinez",
      role: "Mechanical Engineer",
      groupId: "group-mechanical",
      email: "bob@example.com",
      active: true,
    },
    {
      id: "user-carol",
      name: "Carol Davis",
      role: "Electrical Engineer",
      groupId: "group-electrical",
      email: "carol@example.com",
      active: true,
    },
    {
      id: "user-dan",
      name: "Dan Wilson",
      role: "PLC Engineer",
      groupId: "group-plc",
      email: "dan@example.com",
      active: true,
    },
    {
      id: "user-eve",
      name: "Eve Kumar",
      role: "Vision Software Engineer",
      groupId: "group-vision",
      email: "eve@example.com",
      active: true,
    },
    {
      id: "user-frank",
      name: "Frank Lee",
      role: "Commissioning Engineer",
      groupId: "group-quality",
      email: "frank@example.com",
      active: true,
    },
  ];

  const phases: Phase[] = [
    {
      ...defaultPhases()[0],
      startDate: d(-30),
      dueDate: d(-5),
    },
    {
      ...defaultPhases()[1],
      startDate: d(-15),
      dueDate: d(10),
    },
    {
      ...defaultPhases()[2],
      startDate: d(-10),
      dueDate: d(25),
    },
    {
      ...defaultPhases()[3],
      startDate: d(20),
      dueDate: d(35),
    },
    {
      ...defaultPhases()[4],
      startDate: d(40),
      dueDate: d(55),
    },
    {
      ...defaultPhases()[5],
      startDate: d(55),
      dueDate: d(75),
    },
  ];

  const comment = (
    taskId: string | null,
    author: string,
    text: string,
    type: Comment["type"],
    dayOffset: number
  ): Comment => ({
    id: uid("comment"),
    taskId,
    author,
    text,
    type,
    createdAt: new Date(`${d(dayOffset)}T09:00:00`).toISOString(),
  });

  const task = (opts: any): Task => {
    const startDate: string = opts.startDate;
    const dueDate: string =
      opts.dueDate || addDays(startDate, opts.durationDays ?? 1);

    return {
      id: opts.id,
      phaseId: opts.phaseId,
      parentId: opts.parentId ?? null,
      title: opts.title,
      description: opts.description ?? "",
      assigneeIds: opts.assigneeIds ?? [],
      groupIds: opts.groupIds ?? [],
      startDate,
      dueDate,
      durationDays:
        opts.durationDays ?? Math.max(0, diffDays(startDate, dueDate)),
      status: opts.status ?? "Not Started",
      progress: clampPercent(opts.progress ?? 0),
      priority: opts.priority ?? "Medium",
      dependencies: opts.dependencies ?? [],
      comments: opts.comments ?? [],
      attachments: [],
      attachmentIds: opts.attachmentIds ?? [],
      isMilestone: Boolean(opts.isMilestone),
      milestoneLabel: opts.milestoneLabel,
      internalNotes: opts.internalNotes ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const tasks: Task[] = [
    task({
      id: "task-p1-root",
      phaseId: "phase-1",
      title: "System Design & Procurement",
      description: "Master phase task for design and procurement.",
      startDate: d(-30),
      dueDate: d(-5),
      status: "In Progress",
      progress: 70,
      priority: "High",
      assigneeIds: ["user-alice", "user-carol", "user-bob"],
      groupIds: ["group-project-management", "group-electrical", "group-mechanical"],
    }),
    task({
      id: "task-p1-schematics",
      phaseId: "phase-1",
      parentId: "task-p1-root",
      title: "Electrical schematics release",
      description: "Complete power, I/O, safety, and vision interface schematics.",
      startDate: d(-30),
      dueDate: d(-20),
      status: "Completed",
      progress: 100,
      priority: "High",
      assigneeIds: ["user-carol"],
      groupIds: ["group-electrical"],
      comments: [
        comment(
          "task-p1-schematics",
          "Carol Davis",
          "Schematics released to panel build team.",
          "Progress",
          -20
        ),
      ],
    }),
    task({
      id: "task-p1-bom",
      phaseId: "phase-1",
      parentId: "task-p1-root",
      title: "Mechanical BOM & long-lead list",
      description: "Finalize BOM, cameras, lenses, lights, actuators, brackets.",
      startDate: d(-28),
      dueDate: d(-18),
      status: "Completed",
      progress: 100,
      priority: "High",
      assigneeIds: ["user-bob"],
      groupIds: ["group-mechanical"],
    }),
    task({
      id: "task-p1-po",
      phaseId: "phase-1",
      parentId: "task-p1-root",
      title: "Camera / lens / PLC purchase orders issued",
      description: "Issue POs for long-lead automation hardware.",
      startDate: d(-20),
      dueDate: d(-10),
      status: "In Progress",
      progress: 60,
      priority: "Critical",
      assigneeIds: ["user-alice"],
      groupIds: ["group-project-management", "group-electrical"],
      dependencies: ["task-p1-bom"],
      comments: [
        comment(
          "task-p1-po",
          "Alice Chen",
          "Camera vendor lead time extended by 5 days. Escalated to management.",
          "Issue",
          -12
        ),
      ],
      internalNotes:
        "Need to confirm alternate lens supplier if primary camera delivery slips beyond onsite need date.",
    }),
    task({
      id: "milestone-design-freeze",
      phaseId: "phase-1",
      parentId: "task-p1-root",
      title: "Design Freeze",
      description: "Formal design freeze before panel build and software scaffolding.",
      startDate: d(-5),
      dueDate: d(-5),
      durationDays: 0,
      status: "Pending Review",
      progress: 80,
      priority: "Critical",
      isMilestone: true,
      milestoneLabel: "Design Freeze",
      assigneeIds: ["user-alice"],
      groupIds: ["group-project-management"],
      dependencies: ["task-p1-schematics", "task-p1-bom"],
    }),

    task({
      id: "task-p2-root",
      phaseId: "phase-2",
      title: "Panel Wiring & Mechanical Assembly",
      description: "Control panel build, vision rig assembly, sensor mounting.",
      startDate: d(-15),
      dueDate: d(10),
      status: "In Progress",
      progress: 45,
      priority: "High",
      assigneeIds: ["user-carol", "user-bob", "user-eve"],
      groupIds: ["group-electrical", "group-mechanical", "group-vision"],
      dependencies: ["milestone-design-freeze"],
    }),
    task({
      id: "task-p2-panel-layout",
      phaseId: "phase-2",
      parentId: "task-p2-root",
      title: "Control panel layout & backplate drilling",
      startDate: d(-15),
      dueDate: d(-5),
      status: "Completed",
      progress: 100,
      priority: "Medium",
      assigneeIds: ["user-carol"],
      groupIds: ["group-electrical"],
    }),
    task({
      id: "task-p2-panel-wiring",
      phaseId: "phase-2",
      parentId: "task-p2-root",
      title: "Panel wiring: power, I/O, safety circuit",
      startDate: d(-10),
      dueDate: d(5),
      status: "In Progress",
      progress: 55,
      priority: "High",
      assigneeIds: ["user-carol"],
      groupIds: ["group-electrical"],
      dependencies: ["task-p2-panel-layout"],
      comments: [
        comment(
          "task-p2-panel-wiring",
          "Carol Davis",
          "Safety circuit wiring 80% complete. Remaining: vision trigger I/O.",
          "Progress",
          -2
        ),
      ],
    }),
    task({
      id: "task-p2-vision-rig",
      phaseId: "phase-2",
      parentId: "task-p2-root",
      title: "Vision rig assembly & camera mounting",
      startDate: d(-5),
      dueDate: d(8),
      status: "Blocked / On Hold",
      progress: 20,
      priority: "Critical",
      assigneeIds: ["user-bob", "user-eve"],
      groupIds: ["group-mechanical", "group-vision"],
      dependencies: ["task-p1-po"],
      comments: [
        comment(
          "task-p2-vision-rig",
          "Bob Martinez",
          "Blocked: missing M6 camera standoffs. Reordered, expected in 3 days.",
          "Issue",
          -1
        ),
      ],
      internalNotes:
        "Do not start lighting alignment until camera mounts are mechanically stable.",
    }),
    task({
      id: "task-p2-sensor-brackets",
      phaseId: "phase-2",
      parentId: "task-p2-root",
      title: "Sensor mounting bracket fabrication",
      startDate: d(0),
      dueDate: d(9),
      status: "Not Started",
      progress: 0,
      priority: "Medium",
      assigneeIds: ["user-bob"],
      groupIds: ["group-mechanical"],
    }),
    task({
      id: "milestone-panel-ready",
      phaseId: "phase-2",
      parentId: "task-p2-root",
      title: "Panel Ready for Power-up",
      startDate: d(10),
      dueDate: d(10),
      durationDays: 0,
      status: "Not Started",
      progress: 0,
      priority: "High",
      isMilestone: true,
      milestoneLabel: "Panel Ready",
      assigneeIds: ["user-carol"],
      groupIds: ["group-electrical"],
      dependencies: ["task-p2-panel-wiring"],
    }),

    task({
      id: "task-p3-root",
      phaseId: "phase-3",
      title: "Software & PLC Development",
      description: "PLC logic, HMI, vision software, protocol integration.",
      startDate: d(-10),
      dueDate: d(25),
      status: "In Progress",
      progress: 35,
      priority: "High",
      assigneeIds: ["user-dan", "user-eve"],
      groupIds: ["group-plc", "group-vision"],
      dependencies: ["task-p2-panel-wiring"],
    }),
    task({
      id: "task-p3-plc-core",
      phaseId: "phase-3",
      parentId: "task-p3-root",
      title: "PLC ladder / structured text core logic",
      description: "Machine state machine, I/O mapping, alarms, safety responses.",
      startDate: d(-10),
      dueDate: d(10),
      status: "In Progress",
      progress: 50,
      priority: "Critical",
      assigneeIds: ["user-dan"],
      groupIds: ["group-plc"],
      comments: [
        comment(
          "task-p3-plc-core",
          "Dan Wilson",
          "Core state machine drafted. Waiting for final safety I/O list.",
          "Progress",
          -3
        ),
      ],
    }),
    task({
      id: "task-p3-hmi",
      phaseId: "phase-3",
      parentId: "task-p3-root",
      title: "HMI screens & alarm handling",
      startDate: d(0),
      dueDate: d(15),
      status: "In Progress",
      progress: 30,
      priority: "Medium",
      assigneeIds: ["user-dan"],
      groupIds: ["group-plc"],
      dependencies: ["task-p3-plc-core"],
    }),
    task({
      id: "task-p3-vision-software",
      phaseId: "phase-3",
      parentId: "task-p3-root",
      title: "PC vision software: recipe management & calibration",
      startDate: d(-5),
      dueDate: d(20),
      status: "In Progress",
      progress: 25,
      priority: "High",
      assigneeIds: ["user-eve"],
      groupIds: ["group-vision"],
      dependencies: ["task-p2-vision-rig"],
      comments: [
        comment(
          "task-p3-vision-software",
          "Eve Kumar",
          "Recipe schema complete. Calibration UI blocked until rig is stable.",
          "Issue",
          -1
        ),
      ],
    }),
    task({
      id: "task-p3-integration",
      phaseId: "phase-3",
      parentId: "task-p3-root",
      title: "Protocol integration: PLC <-> Vision <-> MES/ERP",
      startDate: d(10),
      dueDate: d(25),
      status: "Not Started",
      progress: 0,
      priority: "High",
      assigneeIds: ["user-dan", "user-eve"],
      groupIds: ["group-plc", "group-vision"],
      dependencies: ["task-p3-plc-core", "task-p3-vision-software"],
    }),

    task({
      id: "task-p4-root",
      phaseId: "phase-4",
      title: "Internal Integration & FAT",
      description: "Factory acceptance test preparation and execution.",
      startDate: d(20),
      dueDate: d(35),
      status: "Not Started",
      progress: 0,
      priority: "High",
      assigneeIds: ["user-frank", "user-dan", "user-eve"],
      groupIds: ["group-quality", "group-plc", "group-vision"],
      dependencies: ["milestone-panel-ready", "task-p3-integration"],
    }),
    task({
      id: "task-p4-dry-run",
      phaseId: "phase-4",
      parentId: "task-p4-root",
      title: "Dry run & I/O checkout",
      startDate: d(20),
      dueDate: d(25),
      status: "Not Started",
      progress: 0,
      priority: "High",
      assigneeIds: ["user-frank", "user-carol"],
      groupIds: ["group-quality", "group-electrical"],
      dependencies: ["milestone-panel-ready"],
    }),
    task({
      id: "task-p4-cycle-time",
      phaseId: "phase-4",
      parentId: "task-p4-root",
      title: "Cycle time verification & tuning",
      startDate: d(25),
      dueDate: d(32),
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      assigneeIds: ["user-frank", "user-dan"],
      groupIds: ["group-quality", "group-plc"],
      dependencies: ["task-p4-dry-run"],
    }),
    task({
      id: "task-p4-debug-log",
      phaseId: "phase-4",
      parentId: "task-p4-root",
      title: "Defect log & debugging",
      startDate: d(25),
      dueDate: d(34),
      status: "Not Started",
      progress: 0,
      priority: "Medium",
      assigneeIds: ["user-frank"],
      groupIds: ["group-quality"],
      dependencies: ["task-p4-cycle-time"],
    }),
    task({
      id: "milestone-fat",
      phaseId: "phase-4",
      parentId: "task-p4-root",
      title: "Internal FAT Sign-off",
      startDate: d(35),
      dueDate: d(35),
      durationDays: 0,
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      isMilestone: true,
      milestoneLabel: "FAT",
      assigneeIds: ["user-alice", "user-frank"],
      groupIds: ["group-project-management", "group-quality"],
      dependencies: ["task-p4-debug-log"],
    }),

    task({
      id: "task-p5-root",
      phaseId: "phase-5",
      title: "Onsite Installation & Commissioning",
      description: "Delivery, hookup, safety verification, commissioning support.",
      startDate: d(40),
      dueDate: d(55),
      status: "Not Started",
      progress: 0,
      priority: "High",
      assigneeIds: ["user-frank", "user-carol", "user-bob"],
      groupIds: ["group-quality", "group-electrical", "group-mechanical"],
      dependencies: ["milestone-fat"],
    }),
    task({
      id: "milestone-onsite-delivery",
      phaseId: "phase-5",
      parentId: "task-p5-root",
      title: "Onsite Delivery",
      startDate: d(40),
      dueDate: d(40),
      durationDays: 0,
      status: "Not Started",
      progress: 0,
      priority: "High",
      isMilestone: true,
      milestoneLabel: "Delivery",
      assigneeIds: ["user-alice"],
      groupIds: ["group-project-management"],
    }),
    task({
      id: "task-p5-hookup",
      phaseId: "phase-5",
      parentId: "task-p5-root",
      title: "Mechanical / electrical hookup",
      startDate: d(42),
      dueDate: d(50),
      status: "Not Started",
      progress: 0,
      priority: "High",
      assigneeIds: ["user-carol", "user-bob"],
      groupIds: ["group-electrical", "group-mechanical"],
      dependencies: ["milestone-onsite-delivery"],
    }),
    task({
      id: "task-p5-safety",
      phaseId: "phase-5",
      parentId: "task-p5-root",
      title: "Safety verification & guard interlocks",
      startDate: d(48),
      dueDate: d(54),
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      assigneeIds: ["user-frank", "user-carol"],
      groupIds: ["group-quality", "group-electrical"],
      dependencies: ["task-p5-hookup"],
    }),

    task({
      id: "task-p6-root",
      phaseId: "phase-6",
      title: "SAT & Final Buyoff",
      description: "Site acceptance test, training, documentation, formal buyoff.",
      startDate: d(55),
      dueDate: d(75),
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      assigneeIds: ["user-alice", "user-frank", "user-eve", "user-dan"],
      groupIds: [
        "group-project-management",
        "group-quality",
        "group-vision",
        "group-plc",
      ],
      dependencies: ["task-p5-safety"],
    }),
    task({
      id: "task-p6-sat-run",
      phaseId: "phase-6",
      parentId: "task-p6-root",
      title: "Production run validation (SAT)",
      startDate: d(55),
      dueDate: d(65),
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      assigneeIds: ["user-frank", "user-eve"],
      groupIds: ["group-quality", "group-vision"],
      dependencies: ["milestone-fat", "task-p5-safety"],
    }),
    task({
      id: "task-p6-training",
      phaseId: "phase-6",
      parentId: "task-p6-root",
      title: "Operator & maintenance training",
      startDate: d(60),
      dueDate: d(68),
      status: "Not Started",
      progress: 0,
      priority: "Medium",
      assigneeIds: ["user-frank"],
      groupIds: ["group-quality"],
      dependencies: ["task-p6-sat-run"],
    }),
    task({
      id: "task-p6-docs",
      phaseId: "phase-6",
      parentId: "task-p6-root",
      title: "Documentation handover: O&M, as-built, backup",
      startDate: d(62),
      dueDate: d(72),
      status: "Not Started",
      progress: 0,
      priority: "High",
      assigneeIds: ["user-alice", "user-carol", "user-eve"],
      groupIds: ["group-project-management", "group-electrical", "group-vision"],
      dependencies: ["task-p6-sat-run"],
    }),
    task({
      id: "milestone-sat",
      phaseId: "phase-6",
      parentId: "task-p6-root",
      title: "SAT Completion",
      startDate: d(65),
      dueDate: d(65),
      durationDays: 0,
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      isMilestone: true,
      milestoneLabel: "SAT",
      assigneeIds: ["user-frank"],
      groupIds: ["group-quality"],
      dependencies: ["task-p6-sat-run"],
    }),
    task({
      id: "milestone-buyoff",
      phaseId: "phase-6",
      parentId: "task-p6-root",
      title: "Final Customer Buyoff",
      startDate: d(75),
      dueDate: d(75),
      durationDays: 0,
      status: "Not Started",
      progress: 0,
      priority: "Critical",
      isMilestone: true,
      milestoneLabel: "Buyoff",
      assigneeIds: ["user-alice"],
      groupIds: ["group-project-management"],
      dependencies: ["milestone-sat", "task-p6-training", "task-p6-docs"],
    }),
  ];

  return {
    id: uid("project"),
    name: "Demo Machine Vision Inspection Cell",
    customer: "Example Manufacturing Inc.",
    projectManager: "Alice Chen",
    startDate: d(-30),
    endDate: d(75),
    phases,
    tasks,
    users,
    groups,
    comments: [
      comment(
        null,
        "Alice Chen",
        "Project kickoff completed. Demo data loaded for evaluation.",
        "Note",
        -30
      ),
    ],
    attachmentRegistry: [],
    settings: {
      autoSave: false,
    },
  };
}