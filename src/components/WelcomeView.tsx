import {
  Clock,
  FilePlus2,
  FolderOpen,
  Home,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { Button, Card } from "./ui";
import { formatDateTime } from "../lib/date";

export default function WelcomeView() {
  const {
    lastProject,
    recentProjects,
    pickerBusy,
    resumeLastProject,
    resumeProject,
    openFolder,
    createProjectFolder,
    loadDemo,
    newFromTemplate,
    forgetProject,
  } = useProject();

  const handleResumeLast = async () => {
    if (pickerBusy) return;
    await resumeLastProject();
  };

  const handleResumeSpecific = async (handleKey: string) => {
    if (pickerBusy) return;
    await resumeProject(handleKey);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-center gap-3">
          <Home className="h-5 w-5 text-slate-500" />
          <h1 className="text-lg font-semibold">
            Automation Project Tracker
          </h1>
          <span className="text-xs text-slate-500">
            Local-first • Zero-cloud • SMB-ready
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Welcome</h2>
          <p className="mt-2 text-slate-600">
            Manage industrial automation, machine vision, and system
            integration projects from design through final buyoff. All data
            stays in your local or SMB project folder.
          </p>
        </div>

        {pickerBusy && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            A file or folder picker is currently active. Please close it before
            trying again.
          </div>
        )}

        {lastProject && (
          <Card className="p-6 mb-6 border-blue-200 bg-blue-50/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                  Resume Last Project
                </p>
                <h3 className="mt-1 text-xl font-semibold truncate">
                  {lastProject.name}
                </h3>
                <p className="text-sm text-slate-600 truncate">
                  Folder:{" "}
                  <span className="font-mono">
                    {lastProject.folderName}
                  </span>
                  {lastProject.customer && ` • ${lastProject.customer}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Last opened{" "}
                  {formatDateTime(lastProject.lastOpenedAt)}
                </p>
              </div>

              <Button
                size="md"
                onClick={handleResumeLast}
                disabled={pickerBusy}
              >
                <FolderOpen className="h-4 w-4" />
                Resume Project
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-5">
            <h3 className="font-semibold mb-1">Open Existing Project</h3>
            <p className="text-sm text-slate-600 mb-4">
              Select a folder containing <code>project_data.json</code>.
            </p>
            <Button
              variant="outline"
              onClick={() => void openFolder()}
              disabled={pickerBusy}
            >
              <FolderOpen className="h-4 w-4" />
              Open Folder
            </Button>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-1">Create New Project</h3>
            <p className="text-sm text-slate-600 mb-4">
              Start from the automation lifecycle template.
            </p>
            <Button
              variant="outline"
              onClick={() => void createProjectFolder()}
              disabled={pickerBusy}
            >
              <FilePlus2 className="h-4 w-4" />
              Create Project Folder
            </Button>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-5">
            <h3 className="font-semibold mb-1">Load Demo Project</h3>
            <p className="text-sm text-slate-600 mb-4">
              Explore all features with a pre-populated machine-vision project.
            </p>
            <Button
              variant="secondary"
              onClick={loadDemo}
              disabled={pickerBusy}
            >
              <Sparkles className="h-4 w-4" />
              Load Demo
            </Button>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-1">New Empty Template</h3>
            <p className="text-sm text-slate-600 mb-4">
              Create a blank automation template in memory.
            </p>
            <Button
              variant="secondary"
              onClick={newFromTemplate}
              disabled={pickerBusy}
            >
              <FilePlus2 className="h-4 w-4" />
              New Template
            </Button>
          </Card>
        </div>

        {recentProjects.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Projects
            </h3>

            <div className="space-y-2">
              {recentProjects.map((p) => (
                <div
                  key={p.handleKey}
                  className="flex items-center justify-between gap-3 border border-slate-200 rounded-md p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      <span className="font-mono">{p.folderName}</span>
                      {p.customer && ` • ${p.customer}`} •{" "}
                      {formatDateTime(p.lastOpenedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResumeSpecific(p.handleKey)}
                      disabled={pickerBusy}
                    >
                      Open
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove "${p.name}" from recent list? The folder and files on disk are not affected.`
                          )
                        ) {
                          forgetProject(p.handleKey);
                        }
                      }}
                      title="Forget from recent list"
                      disabled={pickerBusy}
                    >
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}