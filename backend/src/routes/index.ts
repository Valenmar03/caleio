import { Router } from "express";
import appointmentsRoutes from "./appointments.routes";
import agendaRoutes from "./agenda.routes";
import professionalRoutes from "./professionals.routes";
import clientsRoutes from "./clients.routes";
import servicesRoutes from "./services.routes";
import businessRoutes from "./business.routes";
import analyticsRoutes from "./analytics.routes";
import { authenticate } from "../middleware/authenticate";
import { changePasswordHandler, updateUserHandler } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { changePasswordBody, updateUserBody } from "../validators";

const router = Router();

router.use(authenticate);

router.post("/auth/change-password", validate(changePasswordBody), changePasswordHandler);
router.patch("/auth/me", validate(updateUserBody), updateUserHandler);

router.use("/appointments", appointmentsRoutes);
router.use("/agenda", agendaRoutes);
router.use("/professionals", professionalRoutes);
router.use("/clients", clientsRoutes);
router.use("/services", servicesRoutes);
router.use("/business", businessRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
