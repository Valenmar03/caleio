import { Request, Response } from "express";
import { clientService } from "../services/clients.service";

export async function listClientsHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { search } = req.query;

    const clients = await clientService.listClients({
      businessId,
      search: search ? String(search) : undefined,
    });

    return res.json({ clients });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getClientByIdHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const client = await clientService.getClientById(String(id), businessId);

    return res.json({ client });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createClientHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { fullName, phone, email, notes } = req.body;

    const client = await clientService.createClient(
      {
        fullName,
        phone,
        ...(email !== undefined ? { email } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      businessId
    );

    return res.status(201).json({ client });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function updateClientHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { fullName, phone, email, notes } = req.body;

    const client = await clientService.updateClient(
      String(id),
      {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      businessId
    );

    return res.json({ client });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function deleteClientHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    await clientService.deleteClient(String(id), businessId);

    return res.status(204).send();
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getClientAppointmentsHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;

    const appointments = await clientService.getClientAppointments(String(id), businessId);

    return res.json({ appointments });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
