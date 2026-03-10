import { Request, Response } from "express";
import { serviceService } from "../services/services.service";

export async function getServicesHandler(req: Request, res: Response) {
  try {
    const { search, activeOnly } = req.query;

    const services = await serviceService.listServices({
      search: search ? String(search) : undefined,
      activeOnly: activeOnly ? String(activeOnly) !== "false" : true,
    });

    return res.json({ services });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}