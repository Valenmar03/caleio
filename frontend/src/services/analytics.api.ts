import { apiFetch } from "./api";
import type { AnalyticsResponse } from "../types/entities";

export function getAnalytics(period: "week" | "month", refDate?: string) {
  const params = new URLSearchParams({ period });
  if (refDate) params.set("refDate", refDate);
  return apiFetch<AnalyticsResponse>(`/analytics?${params.toString()}`);
}
