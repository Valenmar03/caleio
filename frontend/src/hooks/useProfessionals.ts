import { useQuery } from "@tanstack/react-query";
import { getProfessionals, getProfessionalServices } from "../services/professionals.api";

export function useProfessionals() {

  
  return useQuery({
    queryKey: ["professionals"],
    queryFn: getProfessionals
  });
}

export function useProfessionalServices(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: () =>
      getProfessionalServices({
        professionalId: professionalId!,
      }),
    enabled: !!professionalId,
  });
}