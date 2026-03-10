import { DateTime } from "luxon";

const TZ = "America/Argentina/Buenos_Aires";

export function dayRange(dateYMD: string) {
  const from = DateTime.fromISO(dateYMD, { zone: TZ }).startOf("day");
  const to = from.plus({ days: 1 });
  return { from: from.toISO()!, to: to.toISO()!, tz: TZ };
}

export function weekRange(dateYMD: string, weekStart: "monday" | "sunday" = "monday") {
  const dt = DateTime.fromISO(dateYMD, { zone: TZ }).startOf("day");

  // Luxon weekday: 1=Lun ... 7=Dom
  const weekday = dt.weekday;

  const start =
    weekStart === "monday"
      ? dt.minus({ days: weekday - 1 })
      : dt.minus({ days: weekday % 7 }); // domingo => 0, lunes => 1, ...

  const from = start.startOf("day");
  const to = from.plus({ days: 7 });

  return { from: from.toISO()!, to: to.toISO()!, tz: TZ };
}

export function dayOfWeekFromYMD(dateYMD: string) {
  const dt = DateTime.fromISO(dateYMD, { zone: TZ });
  return dt.weekday % 7; // 1=lun..7=dom -> 1..6,0
}

export function monthRange(monthYM: string) {
  const from = DateTime.fromISO(`${monthYM}-01`, { zone: TZ }).startOf("day");
  const to = from.plus({ months: 1 });
  return { from: from.toISO()!, to: to.toISO()!, tz: TZ };
}

export function isYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function isYM(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}