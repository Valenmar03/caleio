import { prisma } from "../db/prisma";

function getDateRange(period: "week" | "month", refDate?: string): { from: Date; to: Date } {
  const ref = refDate ? new Date(refDate + "T12:00:00") : new Date();
  if (period === "week") {
    const day = ref.getDay();
    const from = new Date(ref);
    from.setDate(ref.getDate() - ((day + 6) % 7));
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  } else {
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
}

function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const analyticsService = {
  async getAnalytics(businessId: string, period: "week" | "month", refDate?: string) {
    const { from, to } = getDateRange(period, refDate);

    const appointments = await prisma.appointment.findMany({
      where: { businessId, startAt: { gte: from, lte: to } },
      include: {
        service: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true, color: true } },
      },
    });

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === "COMPLETED");
    const canceled = appointments.filter((a) => a.status === "CANCELED").length;
    const noShow = appointments.filter((a) => a.status === "NO_SHOW").length;
    const totalRevenue = completed.reduce((s, a) => s + Number(a.totalPrice ?? 0), 0);
    const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

    const days = eachDay(from, to);

    const revenueByDay = days.map((date) => ({
      date,
      revenue: completed
        .filter((a) => toDateStr(a.startAt) === date)
        .reduce((s, a) => s + Number(a.totalPrice ?? 0), 0),
    }));

    const appointmentsByDay = days.map((date) => ({
      date,
      count: appointments.filter((a) => toDateStr(a.startAt) === date).length,
    }));

    // Top services
    const svcMap: Record<string, { name: string; count: number }> = {};
    appointments.forEach((a) => {
      if (!svcMap[a.service.id]) svcMap[a.service.id] = { name: a.service.name, count: 0 };
      svcMap[a.service.id].count++;
    });
    const topServices = Object.values(svcMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((s) => ({
        name: s.name,
        count: s.count,
        percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
      }));

    // Peak hours (UTC-3, Argentina)
    const hourMap: Record<string, number> = {};
    appointments.forEach((a) => {
      const localHour = ((a.startAt.getUTCHours() - 3) + 24) % 24;
      const h = localHour.toString().padStart(2, "0") + ":00";
      hourMap[h] = (hourMap[h] ?? 0) + 1;
    });
    const peakHours = Object.entries(hourMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Top professionals (by count)
    const proMap: Record<string, { name: string; color: string | null; count: number }> = {};
    appointments.forEach((a) => {
      if (!proMap[a.professional.id])
        proMap[a.professional.id] = { name: a.professional.name, color: a.professional.color, count: 0 };
      proMap[a.professional.id].count++;
    });
    const topProfessionals = Object.entries(proMap)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue by professional
    const revByPro: Record<string, { name: string; color: string | null; revenue: number }> = {};
    completed.forEach((a) => {
      const proId = a.professional.id;
      if (!revByPro[proId])
        revByPro[proId] = { name: a.professional.name, color: a.professional.color, revenue: 0 };
      revByPro[proId].revenue += Number(a.totalPrice ?? 0);
    });
    const revenueByProfessional = Object.entries(revByPro)
      .map(([id, d]) => ({ id, ...d, revenue: Math.round(d.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Payment method breakdown
    const paymentMethodLabels: Record<string, string> = {
      CASH: "Efectivo",
      MERCADOPAGO: "Mercado Pago",
      TRANSFER: "Transferencia",
      OTHER: "Otro",
    };
    const pmMap: Record<string, number> = {};
    completed.forEach((a) => {
      const method = a.finalPaymentMethod ?? "OTHER";
      pmMap[method] = (pmMap[method] ?? 0) + 1;
    });
    const pmTotal = Object.values(pmMap).reduce((s, n) => s + n, 0) || 1;
    const revenueByPaymentMethod = Object.entries(pmMap)
      .map(([method, count]) => ({
        method,
        label: paymentMethodLabels[method] ?? method,
        count,
        percentage: Math.round((count / pmTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Appointments by day of week
    const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dowMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    appointments.forEach((a) => { dowMap[a.startAt.getDay()]++; });
    const appointmentsByDayOfWeek = DOW_LABELS.map((day, i) => ({ day, count: dowMap[i] }));

    const revBySvc: Record<string, { name: string; revenue: number }> = {};
    completed.forEach((a) => {
      const svcId = a.service.id;
      if (!revBySvc[svcId])
        revBySvc[svcId] = { name: a.service.name, revenue: 0 };
      revBySvc[svcId].revenue += Number(a.totalPrice ?? 0);
    });
    const revenueByService = Object.values(revBySvc)
      .map((s) => ({ name: s.name, revenue: Math.round(s.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      period,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      summary: {
        totalAppointments: total,
        completedAppointments: completed.length,
        totalRevenue,
        averageTicket: Math.round(averageTicket),
        cancellationRate: total > 0 ? Math.round((canceled / total) * 1000) / 10 : 0,
        noShowRate: total > 0 ? Math.round((noShow / total) * 1000) / 10 : 0,
      },
      revenueByDay,
      appointmentsByDay,
      topServices,
      peakHours,
      topProfessionals,
      revenueByProfessional,
      revenueByPaymentMethod,
      appointmentsByDayOfWeek,
      revenueByService,
    };
  },
};
