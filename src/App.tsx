import { useState } from "react";
import TopNav, { TabKey } from "./components/TopNav";
import DashboardView from "./components/DashboardView";
import TaskTreeView from "./components/TaskTreeView";
import GanttView from "./components/GanttView";
import ReportsView from "./components/ReportsView";
import SetupView from "./components/SetupView";
import WelcomeView from "./components/WelcomeView";
import { useProject } from "./state/ProjectProvider";

export default function App() {
  const { view } = useProject();
  const [tab, setTab] = useState<TabKey>("dashboard");

  if (view === "welcome") {
    return <WelcomeView />;
  }

  return (
    <div className="min-h-screen flex flex-col app-shell">
      <TopNav tab={tab} setTab={setTab} />

      <main className="flex-1 p-4 md:p-6 print:p-0">
        {tab === "dashboard" && <DashboardView />}
        {tab === "tasks" && <TaskTreeView />}
        {tab === "gantt" && <GanttView />}
        {tab === "reports" && <ReportsView />}
        {tab === "setup" && <SetupView />}
      </main>
    </div>
  );
}