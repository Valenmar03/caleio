import { useQuery } from "@tanstack/react-query";
import { getProfessionalAvailability } from "../services/professionals.api";

export function useAvailability(
    professionalId?: string,
    date?: string,
    serviceId?: string
) {
    return useQuery({
        queryKey: ["availability", professionalId, date, serviceId],
        queryFn: () =>
        getProfessionalAvailability({
            professionalId: professionalId!,
            date: date!,
            serviceId: serviceId!,
        }),
        enabled: !!professionalId && !!date && !!serviceId,
    });
}