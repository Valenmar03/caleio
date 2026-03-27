import { Request, Response } from "express";
import { billingService } from "../services/billing.service";

export async function createCheckoutHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const url = await billingService.createCheckoutUrl(businessId);
    res.json({ url });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? "Error interno" });
  }
}

export async function createPortalHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const url = await billingService.createPortalUrl(businessId);
    res.json({ url });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? "Error interno" });
  }
}

export async function getBillingStatusHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const status = await billingService.getStatus(businessId);
    res.json(status);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? "Error interno" });
  }
}

export async function webhookHandler(req: Request, res: Response) {
  try {
    const signature = req.headers["x-signature"] as string;
    if (!signature) return res.status(400).json({ error: "Missing signature" });

    await billingService.handleWebhook(req.body as Buffer, signature);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? "Error interno" });
  }
}
