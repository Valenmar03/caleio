import { prisma } from "../db/prisma";

const BUSINESS_ID = "8c0fe826-dacb-48bf-924a-c6eaa9e1fe76";

export class ClientService {
  async listClients(params?: { search?: string }) {
    const search = params?.search?.trim();

    return prisma.client.findMany({
      where: {
        businessId: BUSINESS_ID,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { fullName: "asc" },
    });
  }
}

export const clientService = new ClientService();