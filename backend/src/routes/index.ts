import { Router } from "express";
import appointmentsRoutes from "./appointments.routes";
import agendaRoutes from "./agenda.routes";
import professionalRoutes from "./professionals.routes";
import clientsRoutes from "./clients.routes";
import servicesRoutes from "./services.routes";

const router = Router();

router.use("/appointments", appointmentsRoutes);
router.use("/agenda", agendaRoutes);
router.use("/professionals", professionalRoutes);
router.use("/clients", clientsRoutes);
router.use("/services", servicesRoutes);

export default router;