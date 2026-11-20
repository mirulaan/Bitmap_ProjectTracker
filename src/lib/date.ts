import type { Task } from "../types";

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISO(date?: string): Date {
  if (!date) return new Date();
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date: string | Date, days: number): string {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(from: string | Date, to: string | Date): number {
  const a = typeof from === "string" ? parseISO(from) : from;
  const b = typeof to === "string" ? parseISO(to) : to;

  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / 86400000);
}

export function formatDisplay(date?: string): string {
  if (!date) return "—";
  return parseISO(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

export function isOverdue(task: Task): boolean {
  if (task.status === "Completed") return false;
  const today = parseISO(todayISO());
  const due = parseISO(task.dueDate);
  return due.getTime() < today.getTime();
}

export function isDueThisWeek(task: Task): boolean {
  if (task.status === "Completed") return false;
  const today = parseISO(todayISO());
  const due = parseISO(task.dueDate);
  const end = parseISO(addDays(today, 7));

  return due.getTime() >= today.getTime() && due.getTime() <= end.getTime();
}