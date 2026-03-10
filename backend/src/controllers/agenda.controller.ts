import { Request, Response } from "express";
import { appointmentService } from "../services/appointments.service";
import {
  dayRange,
  weekRange,
  monthRange,
  isYMD,
  isYM,
  dayOfWeekFromYMD,
} from "../utils/ranges";
import { professionalScheduleService } from "../services/professionalSchedule.service";
import { professionalService } from "../services/professionals.service";

export async function agendaDailyHandler(req: Request, res: Response) {
  try {
    const { professionalId, date, status } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Missing query params: date" });
    }

    const ymd = String(date);
    if (!isYMD(ymd)) {
      return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    }

    const range = dayRange(ymd);
    const dayOfWeek = dayOfWeekFromYMD(ymd);

    const profId = professionalId ? String(professionalId) : undefined;

    const appointmentsPromise = appointmentService.getByRange({
      professionalId: profId,
      from: range.from,
      to: range.to,
      status: status ? (String(status) as any) : undefined,
    });

    if (profId) {
      const [appointments, scheduleBlocks] = await Promise.all([
        appointmentsPromise,
        professionalScheduleService.getScheduleBlocksForDay({
          professionalId: profId,
          dayOfWeek,
        }),
      ]);

      return res.json({
        kind: "daily",
        date: ymd,
        professionalId: profId,
        range,
        scheduleBlocks,
        appointments,
      });
    }

    const professionals = await professionalService.listProfessionals();
    const scheduleEntries = await Promise.all(
      professionals.map(async (professional) => {
        const blocks = await professionalScheduleService.getScheduleBlocksForDay({
          professionalId: professional.id,
          dayOfWeek,
        });

        return [professional.id, blocks] as const;
      })
    );

    const appointments = await appointmentsPromise;
    const scheduleBlocksByProfessional = Object.fromEntries(scheduleEntries);

    return res.json({
      kind: "daily",
      date: ymd,
      range,
      scheduleBlocksByProfessional,
      appointments,
    });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function agendaWeeklyHandler(req: Request, res: Response) {
  try {
    const { professionalId, date, status, weekStart } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Missing query params: date" });
    }

    const ymd = String(date);
    if (!isYMD(ymd)) {
      return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    }

    const ws = String(weekStart || "monday") as "monday" | "sunday";
    const range = weekRange(ymd, ws);
    const profId = professionalId ? String(professionalId) : undefined;

    const appointments = await appointmentService.getByRange({
      professionalId: profId,
      from: range.from,
      to: range.to,
      status: status ? (String(status) as any) : undefined,
    });

    if (profId) {
      const scheduleBlocksByDay =
        await professionalScheduleService.getScheduleBlocksForWeek({
          professionalId: profId,
        });

      return res.json({
        kind: "weekly",
        date: ymd,
        weekStart: ws,
        professionalId: profId,
        range,
        scheduleBlocksByDay,
        appointments,
      });
    }

    return res.json({
      kind: "weekly",
      date: ymd,
      weekStart: ws,
      range,
      appointments,
    });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function agendaMonthlyHandler(req: Request, res: Response) {
  try {
    const { professionalId, month, status } = req.query;

    if (!professionalId || !month) {
      return res.status(400).json({ error: "Missing query params: professionalId, month" });
    }

    const ym = String(month);
    if (!isYM(ym)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }

    const range = monthRange(ym);

    const appointments = await appointmentService.getByRange({
      professionalId: String(professionalId),
      from: range.from,
      to: range.to,
      status: status ? (String(status) as any) : undefined,
    });

    return res.json({ kind: "monthly", month: ym, professionalId: String(professionalId), range, appointments });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}