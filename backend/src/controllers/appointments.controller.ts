import { Request, Response } from "express";
import { appointmentService } from "../services/appointments.service";

export async function createAppointmentHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { professionalId, clientId, serviceId, startAt } = req.body;

    if (!professionalId || !clientId || !serviceId || !startAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await appointmentService.create({
      businessId,
      professionalId,
      clientId,
      serviceId,
      startAt,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function getAppointmentsHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { professionalId, from, to, status } = req.query;

    if (!professionalId || !from || !to) {
      return res.status(400).json({ error: "Missing query params: professionalId, from, to" });
    }

    const appointments = await appointmentService.getByRange({
      businessId,
      professionalId: String(professionalId),
      from: String(from),
      to: String(to),
      status: status ? (String(status) as any) : undefined,
    });

    return res.json({ appointments });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function updateAppointmentHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { professionalId, clientId, serviceId, startAt } = req.body;

    if (!professionalId || !clientId || !serviceId || !startAt) {
      return res.status(400).json({
        error: "Missing required fields: professionalId, clientId, serviceId, startAt",
      });
    }

    const updated = await appointmentService.update({
      businessId,
      appointmentId: String(id),
      professionalId: String(professionalId),
      clientId: String(clientId),
      serviceId: String(serviceId),
      startAt: String(startAt),
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function changeAppointmentStatusHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { status, depositAmount, depositMethod, finalPaymentMethod } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing required field: status" });
    }

    const updated = await appointmentService.changeStatus({
      businessId,
      appointmentId: String(id),
      status,
      depositAmount,
      depositMethod,
      finalPaymentMethod,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function rescheduleAppointmentHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { id } = req.params;
    const { startAt } = req.body;

    if (!startAt) {
      return res.status(400).json({ error: "Missing startAt" });
    }

    const result = await appointmentService.reschedule({
      businessId,
      appointmentId: String(id),
      startAt: String(startAt),
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
