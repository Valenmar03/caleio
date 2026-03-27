import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  const businessId = req.user?.businessId;
  if (!businessId) return res.status(401).json({ error: "Unauthorized" });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionStatus: true, trialEndsAt: true, billingExempt: true },
  });

  if (!business) return res.status(401).json({ error: "Unauthorized" });
  if (business.billingExempt) return next();

  if (business.subscriptionStatus === "ACTIVE") return next();

  if (business.subscriptionStatus === "TRIAL") {
    if (!business.trialEndsAt || business.trialEndsAt > new Date()) return next();
  }

  return res.status(402).json({ error: "SUBSCRIPTION_REQUIRED" });
}
