import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Flag,
  Link2,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { buildChildrenMap, buildProgressMap } from "../lib/project";
import { formatDisplay, isOverdue } from "../lib/date";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskEditorState,
  type TaskPriority,
  type TaskStatus,
} from "../types";
import { Badge, Button, Card, Input, Select, cn } from "./ui";
import TaskEditorModal from "./TaskEditorModal";

export default function TaskTreeView() {
  const { project, updateTask, deleteTask } = useProject();

  const [filters, setFilters] = useState({
    search: "",
    phase: "all",
    status: "all",
    assignee: "all",
    group: "all",
    priority: "all",
    showMilestones: true,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<TaskEditorState | null>(null);

  const taskMap = useMemo(
    () => new Map(project.tasks.map((t) => [t.id, t])),
    [project.tasks]
  );

  const childrenMap = useMemo(
    () => buildChildrenMap(project.tasks),
    [project.tasks]
  );

  const progressMap = useMemo(
    () => buildProgressMap(project.tasks),
    [project.tasks]
  );

  const usersById = useMemo(
    () => new Map(project.users.map((u) => [u.id, u])),
    [project.users]
  );

  const groupsById = useMemo(
    () => new Map(project.groups.map((g) => [g.id, g])),
    [project.groups]
  );

  const phasesSorted = useMemo(
    () => [...project.phases].sort((a, b) => a.order - b.order),
    [project.phases]
  );

  const visibleIds = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    const matches = (t: Task) => {
      const textMatch =
        !search ||
        t.title.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search);

      const phaseMatch =
        filters.phase === "all" || t.phaseId === filters.phase;

      const statusMatch =
        filters.status === "all" || t.status === filters.status;

      const assigneeMatch =
        filters.assignee === "all" || t.assigneeIds.includes(filters.assignee);

      const groupMatch =
        filters.group === "all" || t.groupIds.includes(filters.group);

      const priorityMatch =
        filters.priority === "all" || t.priority === filters.priority;

      const milestoneMatch = filters.showMilestones || !t.isMilestone;

      return (
        textMatch &&
        phaseMatch &&
        statusMatch &&
        assigneeMatch &&
        groupMatch &&
        priorityMatch &&
        milestoneMatch
      );
    };

    const ids = new Set<string>();

    for (const task of project.tasks) {
      if (matches(task)) {
        ids.add(task.id);

        let parentId = task.parentId;
        while (parentId) {
          ids.add(parentId);
          const parent = taskMap.get(parentId);
          parentId = parent?.parentId || null;
        }
      }
    }

    return ids;
  }, [filters, project.tasks, taskMap]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TASK_COL_WIDTH = 360;

  const renderTask = (task: Task, level: number) => {
    const children = (childrenMap.get(task.id) || []).filter((c) =>
      visibleIds.has(c.id)
    );

    const hasChildren = children.length > 0;
    const isOpen = expanded.has(task.id);
    const progress = Math.round(progressMap.get(task.id) ?? task.progress);
    const overdue = isOverdue(task);
    const attachmentCount = task.attachmentIds?.length ?? 0;

    const assigneeNames = task.assigneeIds
      .map((id) => usersById.get(id)?.name)
      .filter(Boolean)
      .join(", ");

    const groupNames = task.groupIds
      .map((id) => groupsById.get(id)?.name)
      .filter(Boolean)
      .join(", ");

    return (
      <div key={task.id}>
        <div
          className={cn(
            "flex items-center border-t border-slate-100 hover:bg-slate-50",
            overdue && "bg-red-50/40 hover:bg-red-50/60"
          )}
          style={{ minHeight: 56 }}
        >
          <div
            className={cn(
              "sticky-col sticky left-0 z-10 border-r border-slate-200 px-2 py-2 shrink-0 flex items-center gap-2",
              overdue ? "bg-red-50" : "bg-white"
            )}
            style={{
              width: TASK_COL_WIDTH,
              minWidth: TASK_COL_WIDTH,
              paddingLeft: 8 + level * 20,
            }}
          >
            <div className="w-5 shrink-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="text-slate-500 hover:text-slate-900"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="inline-block h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {task.isMilestone && (
                  <Flag className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                )}

                <span className="text-xs font-mono text-slate-500 shrink-0">
                  {task.id.slice(-5)}
                </span>

                <span
                  className="text-sm font-medium truncate"
                  title={task.title}
                >
                  {task.title}
                </span>

                {attachmentCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 shrink-0"
                    title={`${attachmentCount} attachment(s)`}
                  >
                    <Paperclip className="h-3 w-3" />
                    {attachmentCount}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-slate-500">
                {assigneeNames && (
                  <span className="truncate max-w-[200px]">
                    {assigneeNames}
                  </span>
                )}
                {groupNames && <span>• {groupNames}</span>}
                {task.dependencies.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {task.dependencies.length}
                  </span>
                )}
                {task.comments.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {task.comments.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex w-28 px-2 py-2 text-xs text-slate-600 shrink-0 items-center">
            {formatDisplay(task.startDate)}
          </div>

          <div
            className={cn(
              "hidden md:flex w-28 px-2 py-2 text-xs shrink-0 items-center",
              overdue ? "text-red-700 font-semibold" : "text-slate-600"
            )}
          >
            {formatDisplay(task.dueDate)}
          </div>

          <div className="w-40 px-2 py-2 shrink-0">
            <Select
              className="w-full text-xs"
              value={task.status}
              onChange={(e) =>
                updateTask(task.id, { status: e.target.value as TaskStatus })
              }
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          {hasChildren ? (
            <div className="w-36 px-2 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-slate-600">
                  {progress}%
                </span>
              </div>
            </div>
          ) : (
            <div className="w-36 px-2 py-2 shrink-0 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={task.progress}
                onChange={(e) =>
                  updateTask(task.id, { progress: Number(e.target.value) })
                }
                className="w-20 accent-blue-600"
              />
              <span className="w-10 text-right text-xs text-slate-600">
                {task.progress}%
              </span>
            </div>
          )}

          <div className="w-28 px-2 py-2 shrink-0">
            <Select
              className="w-full text-xs"
              value={task.priority}
              onChange={(e) =>
                updateTask(task.id, {
                  priority: e.target.value as TaskPriority,
                })
              }
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-28 px-2 py-2 shrink-0 flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              title="Add sub-task"
              onClick={() =>
                setEditor({
                  phaseId: task.phaseId,
                  parentId: task.id,
                })
              }
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              title="Edit task"
              onClick={() =>
                setEditor({
                  task,
                  phaseId: task.phaseId,
                  parentId: task.parentId,
                })
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              title="Delete task"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${task.title}" and all sub-tasks?`
                  )
                ) {
                  deleteTask(task.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>

        {hasChildren && isOpen && (
          <div>
            {children.map((child) => renderTask(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-3 no-print">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9 w-full"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </div>

          <Select
            className="min-w-[160px]"
            value={filters.phase}
            onChange={(e) =>
              setFilters((f) => ({ ...f, phase: e.target.value }))
            }
          >
            <option value="all">All Phases</option>
            {project.phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select
            className="min-w-[160px]"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="all">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            className="min-w-[160px]"
            value={filters.assignee}
            onChange={(e) =>
              setFilters((f) => ({ ...f, assignee: e.target.value }))
            }
          >
            <option value="all">All Assignees</option>
            {project.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>

          <Select
            className="min-w-[160px]"
            value={filters.group}
            onChange={(e) =>
              setFilters((f) => ({ ...f, group: e.target.value }))
            }
          >
            <option value="all">All Groups</option>
            {project.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>

          <Select
            className="min-w-[140px]"
            value={filters.priority}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priority: e.target.value }))
            }
          >
            <option value="all">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.showMilestones}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  showMilestones: e.target.checked,
                }))
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Show milestones
          </label>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setFilters({
                search: "",
                phase: "all",
                status: "all",
                assignee: "all",
                group: "all",
                priority: "all",
                showMilestones: true,
              })
            }
          >
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setExpanded(
                new Set(
                  project.tasks
                    .filter((t) => !t.parentId && visibleIds.has(t.id))
                    .map((t) => t.id)
                )
              )
            }
          >
            Expand root tasks
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(new Set())}
          >
            Collapse all
          </Button>
        </div>
      </Card>

      {phasesSorted.map((phase) => {
        const rootTasks = (childrenMap.get("__root__") || []).filter(
          (t) => t.phaseId === phase.id && visibleIds.has(t.id)
        );

        const phaseProgress =
          rootTasks.length > 0
            ? rootTasks.reduce(
                (sum, t) => sum + (progressMap.get(t.id) ?? t.progress),
                0
              ) / rootTasks.length
            : 0;

        return (
          <Card key={phase.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <h2 className="font-semibold truncate">
                  {phase.order}. {phase.name}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  {phase.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-32">
                  <div className="mb-1 text-right text-xs text-slate-600">
                    {Math.round(phaseProgress)}%
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${phaseProgress}%` }}
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() =>
                    setEditor({
                      phaseId: phase.id,
                      parentId: null,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1280px]">
                <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <div
                    className="sticky-col sticky left-0 z-20 bg-slate-50 border-r border-slate-200 px-3 py-2 shrink-0"
                    style={{
                      width: TASK_COL_WIDTH,
                      minWidth: TASK_COL_WIDTH,
                    }}
                  >
                    Task / WBS
                  </div>
                  <div className="hidden md:flex w-28 px-2 py-2">Start</div>
                  <div className="hidden md:flex w-28 px-2 py-2">Due</div>
                  <div className="w-40 px-2 py-2">Status</div>
                  <div className="w-36 px-2 py-2">Progress</div>
                  <div className="w-28 px-2 py-2">Priority</div>
                  <div className="w-28 px-2 py-2 text-right">Actions</div>
                </div>

                {rootTasks.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No tasks match the current filters in this phase.
                  </div>
                ) : (
                  rootTasks.map((task) => renderTask(task, 0))
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {editor && (
        <TaskEditorModal state={editor} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}