import { Router } from "express";
import {
  getServicesHandler,
  getServiceByIdHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  toggleServiceActiveHandler,
  getServicesWithProfessionalHandler,
} from "../controllers/services.controller";
import { validate } from "../middleware/validate";
import { requireOwner } from "../middleware/requireOwner";
import {
  createServiceBody,
  updateServiceBody,
  serviceIdParams,
  servicesQuery,
  toggleServiceBody,
} from "../validators";

const router = Router();

router.get("/", validate(servicesQuery, "query"), getServicesHandler);
router.get("/professionals", validate(servicesQuery, "query"), getServicesWithProfessionalHandler);
router.get("/:id", validate(serviceIdParams, "params"), getServiceByIdHandler);
router.post("/", requireOwner, validate(createServiceBody), createServiceHandler);
router.patch("/:id", requireOwner, validate(serviceIdParams, "params"), validate(updateServiceBody), updateServiceHandler);
router.patch("/:id/active", requireOwner, validate(serviceIdParams, "params"), validate(toggleServiceBody), toggleServiceActiveHandler);
router.delete("/:id", requireOwner, validate(serviceIdParams, "params"), deleteServiceHandler);

export default router;
