import { useQuery } from "@tanstack/react-query";
import { getAgendaDaily, getAgendaWeekly } from "../services/agenda.api";

export function useAgendaDaily(professionalId?: string, date?: string) {
  return useQuery({
    queryKey: ["agenda", "daily", professionalId ?? "all", date],
    queryFn: () =>
      getAgendaDaily({
        professionalId: professionalId || undefined,
        date: date!,
      }),
    enabled: !!date,
  });
}

export function useAgendaWeekly(professionalId?: string, date?: string) {
  return useQuery({
    queryKey: ["agenda", "weekly", professionalId ?? "all", date],
    queryFn: () =>
      getAgendaWeekly({
        professionalId: professionalId || undefined,
        date: date!,
      }),
    enabled: !!date,
  });
}