import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createService, getServices, getServicesWithProfessional, updateService } from "../services/services.api";
import type { ServiceWithProfessional } from "../types/entities";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
}

export function useServicesWithProfessionals() {
  return useQuery({
    queryKey: ["services-professionals"],
    queryFn: getServicesWithProfessional,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services-professionals"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateService,
    onSuccess: (data) => {
      const updated = data.service;
      // Update cache immediately so reopening the modal shows fresh data
      queryClient.setQueryData<{ services: ServiceWithProfessional[] }>(
        ["services-professionals"],
        (old) => {
          if (!old) return old;
          return {
            services: old.services.map((s) =>
              s.id === updated.id ? { ...s, ...updated, professionalServices: s.professionalServices } : s
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services-professionals"] });
    },
  });
}