import { apiFetch } from "./api";
import type { Service } from "../types/entities";

export function getServices() {
  return apiFetch<{ services: Service[] }>("/services");
}