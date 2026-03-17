import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfessionalSchedules,
  updateProfessionalScheduleForDay,
} from "../services/professionals.api";
import type { ProfessionalScheduleBlock } from "../types/entities";

const EMPTY_SCHEDULES: Record<number, ProfessionalScheduleBlock[]> = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
};

export function useProfessionalSchedule(professionalId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professional-schedule", professionalId],
    queryFn: () =>
      getProfessionalSchedules({
        professionalId: professionalId!,
      }),
    enabled: !!professionalId,
  });

  const updateDayMutation = useMutation({
    mutationFn: (params: {
      professionalId: string;
      dayOfWeek: number;
      blocks: { startTime: string; endTime: string }[];
    }) =>
      updateProfessionalScheduleForDay({
        professionalId: params.professionalId,
        dayOfWeek: params.dayOfWeek,
        blocks: params.blocks,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-schedule", variables.professionalId],
      });
    },
  });

  return {
    ...query,
    schedules: query.data?.schedules ?? EMPTY_SCHEDULES,
    updateScheduleForDay: updateDayMutation.mutate,
    updateScheduleForDayAsync: updateDayMutation.mutateAsync,
    isUpdating: updateDayMutation.isPending,
    updateError: updateDayMutation.error,
  };
}

