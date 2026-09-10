import { Router } from "express";
import {
  createCheckoutHandler,
  createPortalHandler,
  getBillingStatusHandler,
} from "../controllers/billing.controller";
import { requireOwner } from "../middleware/requireOwner";

const router = Router();

router.post("/checkout", requireOwner, createCheckoutHandler);
router.post("/portal", requireOwner, createPortalHandler);
// El estado lo lee tambien el PRO: SubscriptionGate envuelve toda la app.
router.get("/status", getBillingStatusHandler);

export default router;
