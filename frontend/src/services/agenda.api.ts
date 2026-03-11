import { apiFetch } from "./api";
import type { DailyAgendaResponse, WeeklyAgendaResponse } from "../types/entities";

export function getAgendaDaily(params: {
  professionalId?: string;
  date: string;
}) {
  const query = new URLSearchParams({
    date: params.date,
    ...(params.professionalId ? { professionalId: params.professionalId } : {}),
  });

  return apiFetch<DailyAgendaResponse>(`/agenda/daily?${query.toString()}`);
}

export function getAgendaWeekly(params: {
  professionalId?: string;
  date: string;
}) {
  const query = new URLSearchParams({
    date: params.date,
    ...(params.professionalId ? { professionalId: params.professionalId } : {}),
  });

  return apiFetch<WeeklyAgendaResponse>(`/agenda/weekly?${query.toString()}`);
}