import type { ReactNode } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Trash2,
  UserX2,
} from "lucide-react";

import type { AppointmentStatus, AppointmentUiStatus
 } from "../types/entities";

export type AppointmentStatusMeta = {
  label: string;
  shortLabel: string;
  priority: number;

  dotClass: string;
  badgeClass: string;
  secondaryBadgeClass: string;

  cardClass: string;
  titleClass: string;
  metaClass: string;

  titlePrefix: string;
  icon: ReactNode;
};

const DEFAULT_STATUS_META: AppointmentStatusMeta = {
  label: "Sin estado",
  shortLabel: "•",
  priority: 0,

  dotClass: "bg-slate-400",
  badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
  secondaryBadgeClass:
    "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200",

  cardClass: "",
  titleClass: "text-slate-800",
  metaClass: "text-slate-500",

  titlePrefix: "Turno",
  icon: <AlertCircle className="h-3.5 w-3.5" />,
};

export const APPOINTMENT_STATUS_META: Record<
  AppointmentUiStatus,
  AppointmentStatusMeta
> = {
  RESERVED: {
    label: "Reservado",
    shortLabel: "•",
    priority: 5,

    dotClass: "bg-cyan-500",
    badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-700",
    secondaryBadgeClass:
      "bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200",

    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",

    titlePrefix: "Reservado",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },

  DEPOSIT_PAID: {
    label: "Señado",
    shortLabel: "$",
    priority: 4,

    dotClass: "bg-teal-500",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-700",
    secondaryBadgeClass:
      "bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200",

    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",

    titlePrefix: "Señado",
    icon: <Check className="h-3.5 w-3.5" />,
  },

  COMPLETED: {
    label: "Realizado",
    shortLabel: "✓",
    priority: 3,

    dotClass: "bg-emerald-500",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    secondaryBadgeClass:
      "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200",

    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",

    titlePrefix: "Completado",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },

  NO_SHOW: {
    label: "No asistió",
    shortLabel: "N",
    priority: 2,

    dotClass: "bg-amber-500",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    secondaryBadgeClass:
      "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200",

    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",

    titlePrefix: "No asistió",
    icon: <UserX2 className="h-3.5 w-3.5" />,
  },

  CANCELED: {
    label: "Cancelado",
    shortLabel: "C",
    priority: 1,

    dotClass: "bg-red-500",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
    secondaryBadgeClass:
      "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200",

    cardClass: "opacity-60",
    titleClass: "text-slate-500 line-through",
    metaClass: "text-slate-400",

    titlePrefix: "Cancelado",
    icon: <Trash2 className="h-3.5 w-3.5" />,
  },

  PENDING_RESOLUTION: {
    label: "Pendiente",
    shortLabel: "!",
    priority: 6,

    dotClass: "bg-violet-500",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    secondaryBadgeClass:
      "bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200",

    cardClass: "",
    titleClass: "text-slate-800",
    metaClass: "text-slate-500",

    titlePrefix: "Pendiente",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

export function getAppointmentUiStatus(input: {
  status?: AppointmentStatus;
  isPendingResolution?: boolean;
}): AppointmentUiStatus | undefined {
  if (input.isPendingResolution) return "PENDING_RESOLUTION";
  return input.status;
}

export function getAppointmentStatusMeta(
  status?: AppointmentUiStatus
): AppointmentStatusMeta {
  if (!status) return DEFAULT_STATUS_META;
  return APPOINTMENT_STATUS_META[status] ?? DEFAULT_STATUS_META;
}

export function getAppointmentStatusPriority(status?: AppointmentStatus): number {
  if (!status) return 0;
  return APPOINTMENT_STATUS_META[status].priority;
}