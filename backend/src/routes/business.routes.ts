import { Router } from "express";
import {
  getBusinessHandler,
  updateBusinessHandler,
  getBusinessUnavailabilitiesHandler,
  createBusinessUnavailabilityHandler,
  deleteBusinessUnavailabilityHandler,
} from "../controllers/business.controller";
import { validate } from "../middleware/validate";
import {
  updateBusinessBody,
  businessUnavailabilityIdParam,
  createBusinessUnavailabilityBody,
} from "../validators";

const router = Router();

router.get("/", getBusinessHandler);
router.patch("/", validate(updateBusinessBody), updateBusinessHandler);

router.get("/unavailabilities", getBusinessUnavailabilitiesHandler);
router.post(
  "/unavailabilities",
  validate(createBusinessUnavailabilityBody),
  createBusinessUnavailabilityHandler
);
router.delete(
  "/unavailabilities/:unavailabilityId",
  validate(businessUnavailabilityIdParam, "params"),
  deleteBusinessUnavailabilityHandler
);

export default router;
