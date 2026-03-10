export function toHHMM(date: Date): string {
  return date.toTimeString().slice(0, 5); // "HH:MM"
}

export function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0=domingo ... 6=sábado
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}