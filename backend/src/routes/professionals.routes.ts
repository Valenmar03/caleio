import { Router } from "express";
import {
  createProfessionalHandler,
  getProfessionalsHandler,
  updateProfessionalHandler,
  getProfessionalSchedulesHandler,
  replaceProfessionalScheduleForDayHandler,
  getProfessionalServicesHandler,
  replaceProfessionalServicesHandler,
  getProfessionalAvailabilityHandler,
  createProfessionalAccountHandler,
  getProfessionalUnavailabilitiesHandler,
  createProfessionalUnavailabilityHandler,
  deleteProfessionalUnavailabilityHandler,
} from "../controllers/professionals.controller";
import { validate } from "../middleware/validate";
import {
  createProfessionalBody,
  updateProfessionalBody,
  professionalIdParams,
  replaceScheduleParams,
  replaceScheduleBody,
  replaceProfessionalServicesBody,
  professionalAvailabilityQuery,
  createProfessionalAccountBody,
  professionalUnavailabilityParams,
  createUnavailabilityBody,
} from "../validators";

const router = Router();

router.get("/", getProfessionalsHandler);
router.post("/", validate(createProfessionalBody), createProfessionalHandler);
router.patch("/:id", validate(professionalIdParams, "params"), validate(updateProfessionalBody), updateProfessionalHandler);

router.get("/:id/schedules", validate(professionalIdParams, "params"), getProfessionalSchedulesHandler);
router.put("/:id/schedules/:dayOfWeek", validate(replaceScheduleParams, "params"), validate(replaceScheduleBody), replaceProfessionalScheduleForDayHandler);

router.get("/:id/services", validate(professionalIdParams, "params"), getProfessionalServicesHandler);
router.put("/:id/services", validate(professionalIdParams, "params"), validate(replaceProfessionalServicesBody), replaceProfessionalServicesHandler);

router.get("/:id/availability", validate(professionalIdParams, "params"), validate(professionalAvailabilityQuery, "query"), getProfessionalAvailabilityHandler);
router.post("/:id/account", validate(professionalIdParams, "params"), validate(createProfessionalAccountBody), createProfessionalAccountHandler);

router.get("/:id/unavailabilities", validate(professionalIdParams, "params"), getProfessionalUnavailabilitiesHandler);
router.post("/:id/unavailabilities", validate(professionalIdParams, "params"), validate(createUnavailabilityBody), createProfessionalUnavailabilityHandler);
router.delete("/:id/unavailabilities/:unavailabilityId", validate(professionalUnavailabilityParams, "params"), deleteProfessionalUnavailabilityHandler);

export default router;
