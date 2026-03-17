import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "../services/analytics.api";

export function useAnalytics(period: "week" | "month") {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: () => getAnalytics(period),
  });
}
