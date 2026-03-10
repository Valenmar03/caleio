import { apiFetch } from "./api";
import type { Professional } from "../types/agenda";
import type { AvailabilityResponse, ProfessionalServicesResponse } from "../types/entities";

export function getProfessionals() {
  return apiFetch<{ professionals: Professional[] }>("/professionals");
}

export function getProfessionalAvailability(params: {
  professionalId: string;
  date: string;
  serviceId: string;
  stepMin?: number;
}) {
  const query = new URLSearchParams({
    date: params.date,
    serviceId: params.serviceId,
    ...(params.stepMin ? { stepMin: String(params.stepMin) } : {}),
  });

  return apiFetch<AvailabilityResponse>(
    `/professionals/${params.professionalId}/availability?${query.toString()}`
  );
}

export function getProfessionalServices(params: { professionalId: string }) {
  return apiFetch<ProfessionalServicesResponse>(
    `/professionals/${params.professionalId}/services`
  );
}