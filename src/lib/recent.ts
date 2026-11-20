export interface RecentProject {
  id: string;
  name: string;
  customer: string;
  folderName: string;
  handleKey: string;
  lastOpenedAt: string;
}

const KEY = "automation-tracker:recent-projects";
const MAX = 10;

export function getRecentProjects(): RecentProject[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertRecentProject(entry: RecentProject): void {
  const list = getRecentProjects().filter(
    (p) => p.handleKey !== entry.handleKey
  );

  list.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function removeRecentProject(handleKey: string): void {
  const list = getRecentProjects().filter(
    (p) => p.handleKey !== handleKey
  );

  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getLastProject(): RecentProject | null {
  const list = getRecentProjects();
  return list[0] || null;
}