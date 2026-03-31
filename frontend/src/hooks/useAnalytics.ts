import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "../services/analytics.api";

export function useAnalytics(period: "week" | "month", refDate?: string) {
  return useQuery({
    queryKey: ["analytics", period, refDate ?? "current"],
    queryFn: () => getAnalytics(period, refDate),
  });
}
