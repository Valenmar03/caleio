import { Router } from "express";
import { getAnalyticsHandler } from "../controllers/analytics.controller";
import { validate } from "../middleware/validate";
import { analyticsQuery } from "../validators";
import { requireOwner } from "../middleware/requireOwner";

const router = Router();

router.get("/", requireOwner, validate(analyticsQuery, "query"), getAnalyticsHandler);

export default router;
