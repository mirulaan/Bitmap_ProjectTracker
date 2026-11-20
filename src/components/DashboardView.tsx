import { useMemo } from "react";
import {
  AlertTriangle,
  Ban,
  Clock,
  Flag,
  Layers,
  MessageSquare,
} from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { deriveStats } from "../lib/project";
import { formatDisplay, isOverdue } from "../lib/date";
import type { Comment, Task } from "../types";
import { Badge, Card, ProgressBar } from "./ui";

function KpiCard({
  title,
  value,
  sub,
  icon,
  color = "slate",
  progress,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: "slate" | "blue" | "red" | "amber" | "green";
  progress?: number;
}) {
  const colorMap = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>

        <div
          className={`h-10 w-10 rounded-lg border flex items-center justify-center ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
      )}
    </Card>
  );
}

function TaskMiniList({
  title,
  tasks,
  color,
  progressMap,
  phasesById,
}: {
  title: string;
  tasks: Task[];
  color: "red" | "blue" | "amber";
  progressMap: Map<string, number>;
  phasesById: Map<string, any>;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <Badge color={color}>{tasks.length}</Badge>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">None.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const phase = phasesById.get(task.phaseId);
            const progress = Math.round(progressMap.get(task.id) ?? task.progress);

            return (
              <div key={task.id} className="border-b border-slate-100 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {phase?.name || "Unassigned phase"} • Due{" "}
                      {formatDisplay(task.dueDate)}
                    </p>
                  </div>

                  <Badge color={isOverdue(task) ? "red" : "slate"}>
                    {progress}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function DashboardView() {
  const { project } = useProject();

  const stats = useMemo(() => deriveStats(project), [project]);

  const phasesSorted = useMemo(
    () => [...project.phases].sort((a, b) => a.order - b.order),
    [project.phases]
  );

  const phasesById = useMemo(
    () => new Map(project.phases.map((p) => [p.id, p])),
    [project.phases]
  );

  const recentActivity = useMemo(() => {
    const all: (Comment & { taskTitle?: string })[] = [];

    for (const c of project.comments) {
      all.push({ ...c });
    }

    for (const t of project.tasks) {
      for (const c of t.comments) {
        all.push({ ...c, taskTitle: t.title });
      }
    }

    return all
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8);
  }, [project]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Overall Progress"
          value={`${Math.round(stats.overall)}%`}
          sub={`${project.tasks.length} tasks tracked`}
          icon={<Layers className="h-5 w-5" />}
          color="blue"
          progress={stats.overall}
        />

        <KpiCard
          title="Due This Week"
          value={stats.dueThisWeek.length}
          sub="Including milestones"
          icon={<Clock className="h-5 w-5" />}
          color="slate"
        />

        <KpiCard
          title="Overdue"
          value={stats.overdue.length}
          sub="Requires attention"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />

        <KpiCard
          title="Blocked / On Hold"
          value={stats.blocked.length}
          sub="Escalate dependencies"
          icon={<Ban className="h-5 w-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <h2 className="font-semibold mb-4">Phase Progress</h2>

          <div className="space-y-4">
            {phasesSorted.map((phase) => {
              const progress = stats.phaseProgress.get(phase.id) ?? 0;

              return (
                <div key={phase.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">
                      {phase.order}. {phase.name}
                    </span>
                    <span className="text-slate-600">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  <ProgressBar value={progress} />

                  <div className="mt-1 text-xs text-slate-500">
                    {phase.startDate ? formatDisplay(phase.startDate) : "TBD"}{" "}
                    →{" "}
                    {phase.dueDate ? formatDisplay(phase.dueDate) : "TBD"}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-4">Progress by Department</h2>

          <div className="space-y-4">
            {stats.groupProgress.map((gp) => (
              <div key={gp.group.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{gp.group.name}</span>
                  <span className="text-slate-600">
                    {Math.round(gp.progress)}% • {gp.taskCount} tasks
                  </span>
                </div>

                <ProgressBar value={gp.progress} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskMiniList
          title="Overdue Tasks"
          tasks={stats.overdue.slice(0, 6)}
          color="red"
          progressMap={stats.taskProgress}
          phasesById={phasesById}
        />

        <TaskMiniList
          title="Due This Week"
          tasks={stats.dueThisWeek.slice(0, 6)}
          color="blue"
          progressMap={stats.taskProgress}
          phasesById={phasesById}
        />

        <TaskMiniList
          title="Blocked / On Hold"
          tasks={stats.blocked.slice(0, 6)}
          color="amber"
          progressMap={stats.taskProgress}
          phasesById={phasesById}
        />
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Milestones
        </h2>

        {stats.milestones.length === 0 ? (
          <p className="text-sm text-slate-500">No milestones defined.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Milestone</th>
                  <th className="py-2 pr-3">Phase</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Progress</th>
                </tr>
              </thead>
              <tbody>
                {stats.milestones.map((m) => {
                  const phase = phasesById.get(m.phaseId);
                  const progress = Math.round(
                    stats.taskProgress.get(m.id) ?? m.progress
                  );

                  return (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">
                        {m.milestoneLabel || m.title}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {phase?.name || "—"}
                      </td>
                      <td className="py-2 pr-3">{formatDisplay(m.dueDate)}</td>
                      <td className="py-2 pr-3">
                        <Badge
                          color={
                            m.status === "Completed"
                              ? "green"
                              : m.status === "Blocked / On Hold"
                                ? "red"
                                : m.status === "Pending Review"
                                  ? "amber"
                                  : "slate"
                          }
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-2 w-32">
                        <ProgressBar value={progress} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Recent Activity / Issue Log
        </h2>

        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity logged yet.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((c) => (
              <div
                key={c.id}
                className="border-b border-slate-100 pb-3 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {c.taskTitle ? `${c.taskTitle} — ` : "Project — "}
                      {c.text}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.author} • {new Date(c.createdAt).toLocaleString()}
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
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}