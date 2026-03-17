import { prisma } from "../db/prisma";

export type CreateClientInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

export type UpdateClientInput = {
  fullName?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
};

class ClientService {
  async listClients(params: { businessId: string; search?: string }) {
    const { businessId, search } = params;
    const q = search?.trim();

    const clients = await prisma.client.findMany({
      where: {
        businessId,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        appointments: {
          select: { id: true, totalPrice: true, status: true },
        },
      },
      orderBy: [{ fullName: "asc" }, { createdAt: "desc" }],
    });

    return clients.map((client) => {
      const validAppointments = client.appointments.filter(
        (appt) => appt.status !== "CANCELED"
      );
      const visitsCount = validAppointments.length;
      const totalSpent = validAppointments.reduce(
        (acc, appt) => acc + Number(appt.totalPrice ?? 0),
        0
      );
      return {
        id: client.id,
        businessId: client.businessId,
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
        notes: client.notes,
        createdAt: client.createdAt,
        visitsCount,
        totalSpent,
      };
    });
  }

  async getClientById(id: string, businessId: string) {
    const client = await prisma.client.findFirst({
      where: { id, businessId },
      include: {
        appointments: {
          select: { id: true, totalPrice: true, status: true },
        },
      },
    });

    if (!client) {
      const error: any = new Error("Client not found");
      error.status = 404;
      throw error;
    }

    const validAppointments = client.appointments.filter(
      (appt) => appt.status !== "CANCELED"
    );
    const visitsCount = validAppointments.length;
    const totalSpent = validAppointments.reduce(
      (acc, appt) => acc + Number(appt.totalPrice ?? 0),
      0
    );

    return {
      id: client.id,
      businessId: client.businessId,
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      notes: client.notes,
      createdAt: client.createdAt,
      visitsCount,
      totalSpent,
    };
  }

  async createClient(data: CreateClientInput, businessId: string) {
    const fullName = data.fullName?.trim();
    const phone = data.phone?.trim();
    const email = data.email?.trim() || null;
    const notes = data.notes?.trim() || null;

    if (!fullName) {
      const error: any = new Error("fullName is required");
      error.status = 400;
      throw error;
    }

    if (!phone) {
      const error: any = new Error("phone is required");
      error.status = 400;
      throw error;
    }

    const existing = await prisma.client.findFirst({
      where: { businessId, phone },
    });

    if (existing) {
      const error: any = new Error("A client with that phone already exists");
      error.status = 409;
      throw error;
    }

    return prisma.client.create({
      data: { businessId, fullName, phone, email, notes },
    });
  }

  async updateClient(id: string, data: UpdateClientInput, businessId: string) {
    await this.getClientById(id, businessId);

    const updateData: any = {};

    if (data.fullName !== undefined) {
      const fullName = data.fullName.trim();
      if (!fullName) {
        const error: any = new Error("fullName cannot be empty");
        error.status = 400;
        throw error;
      }
      updateData.fullName = fullName;
    }

    if (data.phone !== undefined) {
      const phone = data.phone.trim();
      if (!phone) {
        const error: any = new Error("phone cannot be empty");
        error.status = 400;
        throw error;
      }

      const existing = await prisma.client.findFirst({
        where: { businessId, phone, NOT: { id } },
      });

      if (existing) {
        const error: any = new Error("A client with that phone already exists");
        error.status = 409;
        throw error;
      }

      updateData.phone = phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email?.trim() || null;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.trim() || null;
    }

    return prisma.client.update({ where: { id }, data: updateData });
  }

  async deleteClient(id: string, businessId: string) {
    await this.getClientById(id, businessId);
    return prisma.client.delete({ where: { id } });
  }

  async searchClients(params: { q: string; limit?: number; businessId: string }) {
    const { businessId } = params;
    const q = params.q.trim();
    const limit = Math.min(params.limit ?? 8, 20);

    if (!q) return [];

    return prisma.client.findMany({
      where: {
        businessId,
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ fullName: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  async getClientAppointments(clientId: string, businessId: string) {
    await this.getClientById(clientId, businessId);

    return prisma.appointment.findMany({
      where: { businessId, clientId },
      include: {
        service: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startAt: "desc" },
      take: 20,
    });
  }
}

export const clientService = new ClientService();
