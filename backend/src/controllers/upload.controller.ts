import type { Request, Response } from "express";
import { prisma } from "../db/prisma";

export async function uploadLogoHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await prisma.business.update({
      where: { id: businessId },
      data: { logoUrl },
    });

    return res.json({ logoUrl });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
