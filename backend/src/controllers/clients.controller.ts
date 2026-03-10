import { Request, Response } from "express";
import { clientService } from "../services/clients.service";

export async function getClientsHandler(req: Request, res: Response) {
  try {
    const { search } = req.query;

    const clients = await clientService.listClients({
      search: search ? String(search) : undefined,
    });

    return res.json({ clients });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}