import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusiness, updateBusiness } from "../services/business.api";

export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: getBusiness,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
  });
}
