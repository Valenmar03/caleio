import { prisma } from "../db/prisma";



const BUSINESS_ID = "976dac1d-a819-4f13-8e60-32f6ab65c60a";


export class ProfessionalScheduleService {
    async getScheduleBlocksForDay(params: {
        professionalId: string;
        dayOfWeek: number;
    }) {
        const { professionalId, dayOfWeek } = params;

        return prisma.professionalSchedule.findMany({
            where: {
            businessId: BUSINESS_ID,
            professionalId,
            dayOfWeek,
            },
            orderBy: [{ startTime: "asc" }],
        });
    }

    async getScheduleBlocksForWeek(params: {
    professionalId: string;
    }) {
    const { professionalId } = params;

    const blocks = await prisma.professionalSchedule.findMany({
        where: {
        businessId: BUSINESS_ID,
        professionalId,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const grouped: Record<number, typeof blocks> = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
    };

    for (const block of blocks) {
        grouped[block.dayOfWeek].push(block);
    }

    return grouped;
    }
}

export const professionalScheduleService = new ProfessionalScheduleService();