import { apiFetch } from "./api";
import type { Client } from "../types/entities";

export function getClients(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<{ clients: Client[] }>(`/clients${query}`);
}