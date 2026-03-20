import { Router } from "express";
import {
  getBusinessInfoHandler,
  getServicesHandler,
  getProfessionalsHandler,
  getAvailabilityHandler,
  createAppointmentHandler,
} from "../controllers/public.controller";

const router = Router();

router.get("/:slug/info", getBusinessInfoHandler);
router.get("/:slug/services", getServicesHandler);
router.get("/:slug/professionals", getProfessionalsHandler);
router.get("/:slug/professionals/:professionalId/availability", getAvailabilityHandler);
router.post("/:slug/appointments", createAppointmentHandler);

export default router;
