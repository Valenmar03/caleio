import { Router } from "express";
import { agendaDailyHandler, agendaWeeklyHandler, agendaMonthlyHandler } from "../controllers/agenda.controller";
import { validate } from "../middleware/validate";
import { agendaDailyQuery, agendaWeeklyQuery, agendaMonthlyQuery } from "../validators";

const router = Router();

router.get("/daily", validate(agendaDailyQuery, "query"), agendaDailyHandler);
router.get("/weekly", validate(agendaWeeklyQuery, "query"), agendaWeeklyHandler);
router.get("/monthly", validate(agendaMonthlyQuery, "query"), agendaMonthlyHandler);

export default router;
