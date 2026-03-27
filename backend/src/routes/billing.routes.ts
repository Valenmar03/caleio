import { Router } from "express";
import {
  createCheckoutHandler,
  createPortalHandler,
  getBillingStatusHandler,
} from "../controllers/billing.controller";

const router = Router();

router.post("/checkout", createCheckoutHandler);
router.post("/portal", createPortalHandler);
router.get("/status", getBillingStatusHandler);

export default router;
