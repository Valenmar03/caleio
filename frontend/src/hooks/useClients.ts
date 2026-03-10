import { useQuery } from "@tanstack/react-query";
import { getClients } from "../services/clients.api";

export function useClients(search?: string) {
  return useQuery({
    queryKey: ["clients", search],
    queryFn: () => getClients(search),
  });
}