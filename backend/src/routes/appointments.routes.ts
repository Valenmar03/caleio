import { Router } from "express";
import {
  createAppointmentHandler,
  getAppointmentsHandler,
  changeAppointmentStatusHandler,
  rescheduleAppointmentHandler,
  updateAppointmentHandler,
  deleteAppointmentHandler,
} from "../controllers/appointments.controller";
import { validate } from "../middleware/validate";
import {
  createAppointmentBody,
  updateAppointmentBody,
  changeAppointmentStatusBody,
  rescheduleAppointmentBody,
  appointmentIdParams,
  appointmentsQuery,
} from "../validators";

const router = Router();

router.post("/", validate(createAppointmentBody), createAppointmentHandler);
router.get("/", validate(appointmentsQuery, "query"), getAppointmentsHandler);
router.patch("/:id", validate(appointmentIdParams, "params"), validate(updateAppointmentBody), updateAppointmentHandler);
router.patch("/:id/status", validate(appointmentIdParams, "params"), validate(changeAppointmentStatusBody), changeAppointmentStatusHandler);
router.patch("/:id/reschedule", validate(appointmentIdParams, "params"), validate(rescheduleAppointmentBody), rescheduleAppointmentHandler);
router.delete("/:id", validate(appointmentIdParams, "params"), deleteAppointmentHandler);

export default router;
