import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { deriveStats } from "../lib/project";
import { formatDisplay, isOverdue } from "../lib/date";
import type { Task } from "../types";
import { Badge, Button, Card, Select } from "./ui";

function PrintHeader({
  project,
  reportTitle,
}: {
  project: any;
  reportTitle: string;
}) {
  return (
    <div className="mb-6 border-b border-slate-300 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-700">
            Customer: {project.customer || "—"}
          </p>
          <p className="text-sm text-slate-700">
            Project Manager / Coordinator: {project.projectManager || "—"}
          </p>
        </div>

        <div className="text-right text-sm text-slate-600">
          <p className="font-semibold">{reportTitle}</p>
          <p>Generated: {new Date().toLocaleString()}</p>
          <p>
            Project Window: {formatDisplay(project.startDate)} –{" "}
            {formatDisplay(project.endDate)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressBarPrint({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className="h-3 w-full overflow-hidden rounded border border-slate-300 bg-slate-100 print-color-adjust-exact">
      <div
        className="h-full bg-blue-600"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function statusBadgeColor(status: string) {
  if (status === "Completed") return "green";
  if (status === "Blocked / On Hold") return "red";
  if (status === "Pending Review") return "amber";
  if (status === "In Progress") return "blue";
  return "slate";
}

export default function ReportsView() {
  const { project } = useProject();
  const stats = useMemo(() => deriveStats(project), [project]);

  const [reportType, setReportType] = useState<"executive" | "detailed">(
    "executive"
  );

  const phasesSorted = useMemo(
    () => [...project.phases].sort((a, b) => a.order - b.order),
    [project.phases]
  );

  const phasesById = useMemo(
    () => new Map(project.phases.map((p) => [p.id, p])),
    [project.phases]
  );

  const usersById = useMemo(
    () => new Map(project.users.map((u) => [u.id, u])),
    [project.users]
  );

  const groupsById = useMemo(
    () => new Map(project.groups.map((g) => [g.id, g])),
    [project.groups]
  );

  const activeTasks = useMemo(
    () => project.tasks.filter((t) => t.status !== "Completed"),
    [project.tasks]
  );

  const detailedByGroup = useMemo(() => {
    const result = project.groups.map((group) => {
      const tasks = activeTasks
        .filter((t) => t.groupIds.includes(group.id))
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

      return { group, tasks };
    });

    const unassigned = activeTasks
      .filter((t) => t.groupIds.length === 0)
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

    if (unassigned.length > 0) {
      result.push({
        group: { id: "unassigned", name: "Unassigned / Coordination" },
        tasks: unassigned,
      });
    }

    return result;
  }, [project.groups, activeTasks]);

  const latestNote = (task: Task) => {
    const lastComment = task.comments[task.comments.length - 1];
    return (
      lastComment?.text ||
      task.internalNotes ||
      task.description ||
      "—"
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-3 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={reportType}
            onChange={(e) =>
              setReportType(e.target.value as "executive" | "detailed")
            }
            className="w-72"
          >
            <option value="executive">
              Executive / Client Summary Report
            </option>
            <option value="detailed">
              Detailed Engineering Action Report
            </option>
          </Select>

          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>

          <p className="text-xs text-slate-500">
            Use your browser print dialog and choose “Save as PDF”. This report
            view is optimized for clean printing.
          </p>
        </div>
      </Card>

      <div className="print-container bg-white border border-slate-200 rounded-xl shadow-sm p-6 print:border-0 print:shadow-none">
        {reportType === "executive" && (
          <>
            <PrintHeader
              project={project}
              reportTitle="Executive / Client Status Summary"
            />

            <section className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">Overall Progress</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">
                    Completion
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(stats.overall)}%
                  </p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">
                    Milestones
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.milestones.length}
                  </p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">
                    Open Tasks
                  </p>
                  <p className="text-2xl font-bold">{activeTasks.length}</p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">
                    Schedule Risk
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.overdue.length > 0 ? "Attention" : "On Track"}
                  </p>
                </div>
              </div>

              <ProgressBarPrint value={stats.overall} />
            </section>

            <section className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">Key Milestones</h2>

              {stats.milestones.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No milestones defined.
                </p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 text-left">
                      <th className="py-2 pr-3 font-semibold">Milestone</th>
                      <th className="py-2 pr-3 font-semibold">Phase</th>
                      <th className="py-2 pr-3 font-semibold">Planned Date</th>
                      <th className="py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.milestones.map((m) => (
                      <tr key={m.id} className="border-b border-slate-200">
                        <td className="py-2 pr-3 font-medium">
                          {m.milestoneLabel || m.title}
                        </td>
                        <td className="py-2 pr-3">
                          {phasesById.get(m.phaseId)?.name || "—"}
                        </td>
                        <td className="py-2 pr-3">{formatDisplay(m.dueDate)}</td>
                        <td className="py-2">
                          <Badge color={statusBadgeColor(m.status)}>
                            {m.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">Phase Status</h2>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left">
                    <th className="py-2 pr-3 font-semibold">Phase</th>
                    <th className="py-2 pr-3 font-semibold">Window</th>
                    <th className="py-2 pr-3 font-semibold">Progress</th>
                    <th className="py-2 font-semibold">Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {phasesSorted.map((phase) => {
                    const progress = stats.phaseProgress.get(phase.id) ?? 0;
                    const assessment =
                      progress >= 100
                        ? "Complete"
                        : progress > 0
                          ? "In Progress"
                          : "Not Started";

                    return (
                      <tr key={phase.id} className="border-b border-slate-200">
                        <td className="py-2 pr-3 font-medium">
                          {phase.order}. {phase.name}
                        </td>
                        <td className="py-2 pr-3">
                          {phase.startDate ? formatDisplay(phase.startDate) : "TBD"}{" "}
                          –{" "}
                          {phase.dueDate ? formatDisplay(phase.dueDate) : "TBD"}
                        </td>
                        <td className="py-2 pr-3 w-40">
                          <div className="flex items-center gap-2">
                            <ProgressBarPrint value={progress} />
                            <span className="w-10 text-right">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2">{assessment}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}

        {reportType === "detailed" && (
          <>
            <PrintHeader
              project={project}
              reportTitle="Detailed Engineering Action Report"
            />

            <section className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">Summary Metrics</h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">Overall</p>
                  <p className="text-xl font-bold">
                    {Math.round(stats.overall)}%
                  </p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">Open</p>
                  <p className="text-xl font-bold">{activeTasks.length}</p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">Overdue</p>
                  <p className="text-xl font-bold text-red-700">
                    {stats.overdue.length}
                  </p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">Blocked</p>
                  <p className="text-xl font-bold text-amber-700">
                    {stats.blocked.length}
                  </p>
                </div>

                <div className="rounded border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">
                    Due This Week
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {stats.dueThisWeek.length}
                  </p>
                </div>
              </div>
            </section>

            <section className="print-break">
              <h2 className="mb-3 text-lg font-semibold">
                Actions by Department / Group
              </h2>

              {detailedByGroup.map(({ group, tasks }) => {
                if (tasks.length === 0) return null;

                return (
                  <div key={group.id} className="mb-6">
                    <h3 className="mb-2 text-base font-semibold">
                      {group.name}
                    </h3>

                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 text-left">
                          <th className="py-2 pr-2 font-semibold">Task</th>
                          <th className="py-2 pr-2 font-semibold">Phase</th>
                          <th className="py-2 pr-2 font-semibold">Owner(s)</th>
                          <th className="py-2 pr-2 font-semibold">Due</th>
                          <th className="py-2 pr-2 font-semibold">Status</th>
                          <th className="py-2 pr-2 font-semibold">Prog.</th>
                          <th className="py-2 pr-2 font-semibold">Priority</th>
                          <th className="py-2 font-semibold">Latest Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => {
                          const owners = task.assigneeIds
                            .map((id) => usersById.get(id)?.name)
                            .filter(Boolean)
                            .join(", ");

                          const groupNames = task.groupIds
                            .map((id) => groupsById.get(id)?.name)
                            .filter(Boolean)
                            .join(", ");

                          const progress = Math.round(
                            stats.taskProgress.get(task.id) ?? task.progress
                          );

                          return (
                            <tr
                              key={task.id}
                              className="border-b border-slate-200 align-top"
                            >
                              <td className="py-2 pr-2">
                                <div className="font-medium">{task.title}</div>
                                <div className="text-[10px] text-slate-500">
                                  {task.id.slice(-8)}
                                  {task.parentId && " • sub-task"}
                                </div>
                              </td>

                              <td className="py-2 pr-2">
                                {phasesById.get(task.phaseId)?.name || "—"}
                              </td>

                              <td className="py-2 pr-2">
                                <div>{owners || "—"}</div>
                                {groupNames && (
                                  <div className="text-[10px] text-slate-500">
                                    {groupNames}
                                  </div>
                                )}
                              </td>

                              <td
                                className={cn(
                                  "py-2 pr-2",
                                  isOverdue(task) &&
                                    "font-semibold text-red-700"
                                )}
                              >
                                {formatDisplay(task.dueDate)}
                              </td>

                              <td className="py-2 pr-2">
                                <Badge color={statusBadgeColor(task.status)}>
                                  {task.status}
                                </Badge>
                              </td>

                              <td className="py-2 pr-2">{progress}%</td>

                              <td className="py-2 pr-2">{task.priority}</td>

                              <td className="py-2">
                                {latestNote(task)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </section>

            <section className="print-break">
              <h2 className="mb-3 text-lg font-semibold">
                Overdue / Escalation List
              </h2>

              {stats.overdue.length === 0 ? (
                <p className="text-sm text-slate-600">No overdue tasks.</p>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 text-left">
                      <th className="py-2 pr-2 font-semibold">Task</th>
                      <th className="py-2 pr-2 font-semibold">Phase</th>
                      <th className="py-2 pr-2 font-semibold">Owner(s)</th>
                      <th className="py-2 pr-2 font-semibold">Due</th>
                      <th className="py-2 pr-2 font-semibold">Status</th>
                      <th className="py-2 font-semibold">Issue / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.overdue.map((task) => {
                      const owners = task.assigneeIds
                        .map((id) => usersById.get(id)?.name)
                        .filter(Boolean)
                        .join(", ");

                      const issueComment =
                        [...task.comments]
                          .reverse()
                          .find((c) => c.type === "Issue")?.text ||
                        task.internalNotes ||
                        latestNote(task);

                      return (
                        <tr
                          key={task.id}
                          className="border-b border-slate-200 align-top"
                        >
                          <td className="py-2 pr-2 font-medium">
                            {task.title}
                          </td>
                          <td className="py-2 pr-2">
                            {phasesById.get(task.phaseId)?.name || "—"}
                          </td>
                          <td className="py-2 pr-2">{owners || "—"}</td>
                          <td className="py-2 pr-2 font-semibold text-red-700">
                            {formatDisplay(task.dueDate)}
                          </td>
                          <td className="py-2 pr-2">{task.status}</td>
                          <td className="py-2">{issueComment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            <section className="print-break">
              <h2 className="mb-3 text-lg font-semibold">
                Recent Internal Activity Log
              </h2>

              {project.comments.length === 0 &&
              project.tasks.every((t) => t.comments.length === 0) ? (
                <p className="text-sm text-slate-600">No activity logged.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {[
                    ...project.comments.map((c) => ({
                      ...c,
                      taskTitle: "Project",
                    })),
                    ...project.tasks.flatMap((t) =>
                      t.comments.map((c) => ({
                        ...c,
                        taskTitle: t.title,
                      }))
                    ),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .slice(0, 30)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="border-b border-slate-200 pb-2"
                      >
                        <div className="font-medium">
                          {c.taskTitle} — {c.text}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.author} • {c.type} •{" "}
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}