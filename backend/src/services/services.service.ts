import { prisma } from "../db/prisma";

const BUSINESS_ID = "8c0fe826-dacb-48bf-924a-c6eaa9e1fe76";

export class ServiceService {
  async listServices(params?: { activeOnly?: boolean; search?: string }) {
    const activeOnly = params?.activeOnly ?? true;
    const search = params?.search?.trim();

    return prisma.service.findMany({
      where: {
        businessId: BUSINESS_ID,
        ...(activeOnly ? { active: true } : {}),
        ...(search
          ? {
              name: { contains: search, mode: "insensitive" },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
  }
}

export const serviceService = new ServiceService();