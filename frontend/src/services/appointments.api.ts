import { apiFetch } from "./api";

export function createAppointment(data: {
  professionalId: string;
  clientId: string;
  serviceId: string;
  startAt: string;
}) {
  return apiFetch("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}