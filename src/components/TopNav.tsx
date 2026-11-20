import { useRef } from "react";
import {
  CalendarRange,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  ListTree,
  Save,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { formatDateTime } from "../lib/date";
import { Button, cn } from "./ui";

export type TabKey = "dashboard" | "tasks" | "gantt" | "reports" | "setup";

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tasks", label: "Tasks / WBS", icon: ListTree },
  { key: "gantt", label: "Gantt", icon: CalendarRange },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "setup", label: "Setup", icon: Settings },
];

export default function TopNav({
  tab,
  setTab,
}: {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
}) {
  const {
    project,
    directoryHandle,
    dirty,
    statusMessage,
    pickerBusy,
    openFolder,
    createProjectFolder,
    saveNow,
    exportJson,
    importJsonFile,
    loadDemo,
    newFromTemplate,
    updateSettings,
    setView,
  } = useProject();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const folderLabel =
    project.settings.directoryName ||
    directoryHandle?.name ||
    "Not connected";

  const lastSaved = project.settings.lastSavedAt
    ? formatDateTime(project.settings.lastSavedAt)
    : "Never";

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {project.customer || "No customer set"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
            <FolderOpen className="h-3 w-3" />
            {folderLabel}
            {dirty && (
              <span className="ml-1 text-amber-600 font-medium">
                • unsaved
              </span>
            )}
          </span>

          <span className="text-xs text-slate-500">Saved: {lastSaved}</span>

          <Button
            size="sm"
            variant="outline"
            onClick={openFolder}
            disabled={pickerBusy}
          >
            <FolderOpen className="h-4 w-4" />
            Open Folder
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={createProjectFolder}
            disabled={pickerBusy}
          >
            <FilePlus2 className="h-4 w-4" />
            Create Folder
          </Button>

          <Button
            size="sm"
            onClick={() => void saveNow()}
            disabled={!directoryHandle || pickerBusy}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={exportJson}
            disabled={pickerBusy}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={pickerBusy}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await importJsonFile(file);
              }
              e.currentTarget.value = "";
            }}
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={loadDemo}
            disabled={pickerBusy}
          >
            <Sparkles className="h-4 w-4" />
            Demo
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={newFromTemplate}
            disabled={pickerBusy}
          >
            <FilePlus2 className="h-4 w-4" />
            New Template
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("welcome")}
            disabled={pickerBusy}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>

          <label className="inline-flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={project.settings.autoSave}
              onChange={(e) =>
                updateSettings({ autoSave: e.target.checked })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-save
          </label>
        </div>
      </div>

      <div className="px-4 border-t border-slate-100">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition",
                  active
                    ? "border-blue-600 text-blue-700 font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {statusMessage && (
        <div className="px-4 pb-2 text-xs text-slate-500 no-print">
          {statusMessage}
        </div>
      )}
    </header>
  );
}