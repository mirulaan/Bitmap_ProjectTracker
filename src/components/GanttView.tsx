import { useMemo, useState } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { buildProgressMap } from "../lib/project";
import { addDays, diffDays, isOverdue, parseISO, todayISO } from "../lib/date";
import type { Task, TaskEditorState, TaskStatus } from "../types";
import { Badge, Button, Card, Select, cn } from "./ui";
import TaskEditorModal from "./TaskEditorModal";

const LEFT_WIDTH = 280;
const HEADER_HEIGHT = 56;
const ROW_HEIGHT = 36;

const statusColors: Record<TaskStatus, string> = {
  "Not Started": "#94a3b8",
  "In Progress": "#3b82f6",
  "Blocked / On Hold": "#ef4444",
  "Pending Review": "#f59e0b",
  Completed: "#22c55e",
};

const phasePalette = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#dc2626",
  "#65a30d",
  "#db2777",
];

export default function GanttView() {
  const { project } = useProject();

  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");
  const [colorMode, setColorMode] = useState<"status" | "phase">("status");
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [editor, setEditor] = useState<TaskEditorState | null>(null);

  const phasesById = useMemo(
    () => new Map(project.phases.map((p) => [p.id, p])),
    [project.phases]
  );

  const phaseOrderById = useMemo(() => {
    const sorted = [...project.phases].sort((a, b) => a.order - b.order);
    return new Map(sorted.map((p, idx) => [p.id, idx]));
  }, [project.phases]);

  const taskMap = useMemo(
    () => new Map(project.tasks.map((t) => [t.id, t])),
    [project.tasks]
  );

  const progressMap = useMemo(
    () => buildProgressMap(project.tasks),
    [project.tasks]
  );

  const rows = useMemo(() => {
    const base = showSubtasks
      ? project.tasks
      : project.tasks.filter((t) => !t.parentId);

    return [...base].sort((a, b) => {
      const pa = phaseOrderById.get(a.phaseId) ?? 99;
      const pb = phaseOrderById.get(b.phaseId) ?? 99;

      if (pa !== pb) return pa - pb;

      return (
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
      );
    });
  }, [project.tasks, showSubtasks, phaseOrderById]);

  const rowIndex = useMemo(
    () => new Map(rows.map((t, idx) => [t.id, idx])),
    [rows]
  );

  const range = useMemo(() => {
    let start = parseISO(project.startDate);
    let end = parseISO(project.endDate);

    for (const t of rows) {
      const s = parseISO(t.startDate);
      const e = parseISO(t.dueDate);

      if (s < start) start = s;
      if (e > end) end = e;
    }

    const rangeStart = addDays(start, -7);
    const rangeEnd = addDays(end, 14);
    const totalDays = Math.max(1, diffDays(rangeStart, rangeEnd) + 1);

    return { rangeStart, rangeEnd, totalDays };
  }, [project.startDate, project.endDate, rows]);

  const dayWidth = zoom === "day" ? 28 : zoom === "week" ? 8 : 3;
  const timelineWidth = Math.ceil(range.totalDays * dayWidth);

  const getGeom = (task: Task) => {
    const left = Math.round(diffDays(range.rangeStart, task.startDate) * dayWidth);
    const days = Math.max(1, diffDays(task.startDate, task.dueDate) + 1);
    const width = task.isMilestone
      ? 14
      : Math.max(8, Math.round(days * dayWidth));

    return { left, width };
  };

  const getColor = (task: Task) => {
    if (colorMode === "status") {
      return statusColors[task.status];
    }

    const idx = phaseOrderById.get(task.phaseId) ?? 0;
    return phasePalette[idx % phasePalette.length];
  };

  const todayX = diffDays(range.rangeStart, todayISO()) * dayWidth;

  const dependencyPaths = useMemo(() => {
    const paths: JSX.Element[] = [];

    for (const task of rows) {
      const targetIdx = rowIndex.get(task.id);
      if (targetIdx === undefined) continue;

      for (const depId of task.dependencies) {
        const source = taskMap.get(depId);
        const sourceIdx = rowIndex.get(depId);

        if (!source || sourceIdx === undefined) continue;

        const sGeom = getGeom(source);
        const tGeom = getGeom(task);

        const x1 = sGeom.left + (source.isMilestone ? 14 : sGeom.width);
        const y1 = sourceIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

        const x2 = tGeom.left;
        const y2 = targetIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

        const d =
          x2 >= x1
            ? `M ${x1} ${y1} L ${x1 + 10} ${y1} L ${x2 - 10} ${y2} L ${x2} ${y2}`
            : `M ${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}`;

        paths.push(
          <path
            key={`${depId}-${task.id}`}
            d={d}
            fill="none"
            stroke="#64748b"
            strokeWidth={1.5}
            markerEnd="url(#arrow)"
          />
        );
      }
    }

    return paths;
  }, [rows, rowIndex, taskMap, dayWidth, range.rangeStart]);

  const headerDays = useMemo(() => {
    return Array.from({ length: range.totalDays }, (_, i) => {
      const dateStr = addDays(range.rangeStart, i);
      const date = parseISO(dateStr);

      let label = "";
      if (zoom === "day") {
        label = String(date.getDate());
      } else if (zoom === "week") {
        if (date.getDay() === 1) {
          label = `${date.toLocaleString(undefined, { month: "short" })} ${date.getDate()}`;
        }
      } else {
        if (date.getDate() === 1) {
          label = `${date.toLocaleString(undefined, { month: "short" })} ${date.getFullYear()}`;
        }
      }

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      return { dateStr, date, label, isWeekend, i };
    });
  }, [range.rangeStart, range.totalDays, zoom]);

  return (
    <div className="space-y-4">
      <Card className="p-3 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={zoom}
            onChange={(e) =>
              setZoom(e.target.value as "day" | "week" | "month")
            }
            className="w-36"
          >
            <option value="day">Day zoom</option>
            <option value="week">Week zoom</option>
            <option value="month">Month zoom</option>
          </Select>

          <Select
            value={colorMode}
            onChange={(e) =>
              setColorMode(e.target.value as "status" | "phase")
            }
            className="w-44"
          >
            <option value="status">Color by status</option>
            <option value="phase">Color by phase</option>
          </Select>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showSubtasks}
              onChange={(e) => setShowSubtasks(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Show sub-tasks
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
            {colorMode === "status"
              ? Object.entries(statusColors).map(([status, color]) => (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1"
                  >
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    {status}
                  </span>
                ))
              : [...project.phases]
                  .sort((a, b) => a.order - b.order)
                  .map((p, idx) => (
                    <span key={p.id} className="inline-flex items-center gap-1">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor:
                            phasePalette[idx % phasePalette.length],
                        }}
                      />
                      {p.name}
                    </span>
                  ))}
          </div>
        </div>
      </Card>

      <div className="overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm max-h-[72vh]">
        <div
          className="relative"
          style={{
            width: LEFT_WIDTH + timelineWidth,
            minWidth: "100%",
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-30 flex border-b border-slate-200 bg-white"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="sticky left-0 z-40 shrink-0 border-r border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
              style={{ width: LEFT_WIDTH }}
            >
              Task
            </div>

            <div
              className="relative"
              style={{ width: timelineWidth, height: HEADER_HEIGHT }}
            >
              {headerDays.map(({ i, isWeekend, label }) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0 border-r border-slate-100",
                    isWeekend && "bg-slate-50"
                  )}
                  style={{
                    left: i * dayWidth,
                    width: dayWidth,
                  }}
                >
                  {label && (
                    <div className="absolute left-1 top-2 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </div>
              ))}

              {todayX >= 0 && todayX <= timelineWidth && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500"
                  style={{ left: todayX }}
                />
              )}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute z-0"
              style={{
                left: LEFT_WIDTH,
                top: 0,
                width: timelineWidth,
                height: rows.length * ROW_HEIGHT,
              }}
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 z" fill="#64748b" />
                </marker>
              </defs>

              {dependencyPaths}
            </svg>

            {todayX >= 0 && todayX <= timelineWidth && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-0 w-px bg-red-500/60"
                style={{ left: LEFT_WIDTH + todayX }}
              />
            )}

            {rows.map((task, idx) => {
              const geom = getGeom(task);
              const color = getColor(task);
              const progress = Math.round(
                progressMap.get(task.id) ?? task.progress
              );
              const overdue = isOverdue(task);
              const phase = phasesById.get(task.phaseId);

              return (
                <div
                  key={task.id}
                  className="flex border-b border-slate-100 hover:bg-slate-50"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-white px-2 py-1"
                    style={{ width: LEFT_WIDTH }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {task.isMilestone && (
                        <Flag className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                      )}

                      {overdue && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                      )}

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {task.title}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {phase?.name || "Unassigned phase"} •{" "}
                          {progress}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative"
                    style={{ width: timelineWidth, height: ROW_HEIGHT }}
                  >
                    {headerDays.map(({ i, isWeekend }) => (
                      <div
                        key={i}
                        className={cn(
                          "absolute top-0 bottom-0 border-r border-slate-50",
                          isWeekend && "bg-slate-50/70"
                        )}
                        style={{
                          left: i * dayWidth,
                          width: dayWidth,
                        }}
                      />
                    ))}

                    {task.isMilestone ? (
                      <button
                        onClick={() =>
                          setEditor({
                            task,
                            phaseId: task.phaseId,
                            parentId: task.parentId,
                          })
                        }
                        title={`${task.title} • ${task.status} • ${progress}%`}
                        className="absolute z-10 cursor-pointer"
                        style={{
                          left: geom.left - 7,
                          top: ROW_HEIGHT / 2 - 7,
                          width: 14,
                          height: 14,
                          transform: "rotate(45deg)",
                          backgroundColor: color,
                          border: overdue
                            ? "2px solid #dc2626"
                            : "1px solid white",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        }}
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setEditor({
                            task,
                            phaseId: task.phaseId,
                            parentId: task.parentId,
                          })
                        }
                        title={`${task.title} • ${task.status} • ${progress}%`}
                        className={cn(
                          "absolute z-10 overflow-hidden rounded border text-left cursor-pointer shadow-sm",
                          overdue && "border-2 border-red-500"
                        )}
                        style={{
                          left: geom.left,
                          top: 10,
                          width: geom.width,
                          height: 16,
                          backgroundColor: `${color}22`,
                          borderColor: overdue ? "#dc2626" : color,
                        }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: color,
                          }}
                        />

                        {geom.width > 90 && (
                          <div className="pointer-events-none absolute inset-0 flex items-center px-2 text-[11px] font-medium text-slate-900">
                            <span className="truncate">{task.title}</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 no-print">
        Tip: click any bar or milestone diamond to edit dates, assignees,
        status, and dependencies.
      </div>

      {editor && (
        <TaskEditorModal state={editor} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}