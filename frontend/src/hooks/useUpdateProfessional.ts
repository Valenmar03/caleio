import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfessional } from "../services/professionals.api";

export function useUpdateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      professionalId: string;
      name?: string;
      color?: string;
      active?: boolean;
    }) => updateProfessional(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["professionals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["professional-services", variables.professionalId],
      });

      queryClient.invalidateQueries({
        queryKey: ["professional-schedule", variables.professionalId],
      });
    },
  });
}