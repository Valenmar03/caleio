import { useQuery } from "@tanstack/react-query";
import { getProfessionals } from "../services/professionals.api";

export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: getProfessionals
  });
}