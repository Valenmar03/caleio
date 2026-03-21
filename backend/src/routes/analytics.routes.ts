import { Router } from "express";
import { getAnalyticsHandler } from "../controllers/analytics.controller";
import { validate } from "../middleware/validate";
import { analyticsQuery } from "../validators";

const router = Router();

router.get("/", validate(analyticsQuery, "query"), getAnalyticsHandler);

export default router;
