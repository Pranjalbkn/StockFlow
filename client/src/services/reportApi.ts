import type { DailyReport } from "../types/DailyReport";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function getDailyReport(date: string) {
  const response = await fetch(`${API_URL}/api/reports/daily?date=${encodeURIComponent(date)}`, {
    credentials: "include",
  });
  const data = await response.json();

  if (!response.ok) throw new Error(data.message ?? "Unable to load report");
  return data.report as DailyReport;
}
