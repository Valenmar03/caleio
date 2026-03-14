import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfessionalServices, updateProfessionalServices } from "../services/professionals.api";

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

export function useUpdateProfessionalServices() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (params: { professionalId: string; serviceIds: string[] }) =>
        updateProfessionalServices(params),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["professional-services", variables.professionalId],
        });

        queryClient.invalidateQueries({
          queryKey: ["professionals"],
        });
      },
    });
  }