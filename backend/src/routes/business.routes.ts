import { Router } from "express";
import {
  getBusinessHandler,
  updateBusinessHandler,
  getBusinessUnavailabilitiesHandler,
  createBusinessUnavailabilityHandler,
  deleteBusinessUnavailabilityHandler,
} from "../controllers/business.controller";
import { validate } from "../middleware/validate";
import { requireOwner } from "../middleware/requireOwner";
import {
  updateBusinessBody,
  businessUnavailabilityIdParam,
  createBusinessUnavailabilityBody,
} from "../validators";

const router = Router();

router.get("/", getBusinessHandler);
router.patch("/", requireOwner, validate(updateBusinessBody), updateBusinessHandler);

router.get("/unavailabilities", getBusinessUnavailabilitiesHandler);
router.post(
  "/unavailabilities",
  requireOwner,
  validate(createBusinessUnavailabilityBody),
  createBusinessUnavailabilityHandler
);
router.delete(
  "/unavailabilities/:unavailabilityId",
  requireOwner,
  validate(businessUnavailabilityIdParam, "params"),
  deleteBusinessUnavailabilityHandler
);

export default router;
