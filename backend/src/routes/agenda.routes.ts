import { Router } from "express";
import { agendaDailyHandler, agendaWeeklyHandler, agendaMonthlyHandler } from "../controllers/agenda.controller";

const router = Router();

router.get("/daily", agendaDailyHandler);
router.get("/weekly", agendaWeeklyHandler);
router.get("/monthly", agendaMonthlyHandler);

export default router;