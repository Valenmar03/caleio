import { apiFetch } from "./api";
import type { AnalyticsResponse } from "../types/entities";

export function getAnalytics(period: "week" | "month") {
  return apiFetch<AnalyticsResponse>(`/analytics?period=${period}`);
}
