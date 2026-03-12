import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfessional } from "../services/professionals.api";

export function useCreateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}