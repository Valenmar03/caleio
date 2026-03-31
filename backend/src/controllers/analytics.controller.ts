import { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service";

export async function getAnalyticsHandler(req: Request, res: Response) {
  try {
    const { businessId, role } = req.user!;
    if (role !== "OWNER") {
      return res.status(403).json({ error: "Solo el owner puede ver el análisis" });
    }
    const period = req.query.period === "week" ? "week" : "month";
    const refDate = typeof req.query.refDate === "string" ? req.query.refDate : undefined;
    const data = await analyticsService.getAnalytics(businessId, period, refDate);
    return res.json(data);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
