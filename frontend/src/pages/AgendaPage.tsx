import { useMemo, useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { useProfessionals } from "../hooks/useProfessionals";
import { useAgendaDaily, useAgendaWeekly } from "../hooks/useAgenda";
import type { AgendaAppointment, Professional } from "../types/agenda";
import NewAppointmentModal from "../components/appointments/NewAppointmentModal";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

type AgendaView = "day" | "week";

function getAppointmentTopAndHeight(appt: AgendaAppointment) {
  const start = parseISO(appt.startAt);
  const end = parseISO(appt.endAt);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const duration = endMinutes - startMinutes;
  const hourStart = start.getHours() * 60;
  const offsetInsideHour = startMinutes - hourStart;

  const top = (offsetInsideHour / 60) * 64;
  const height = Math.max((duration / 60) * 64, 28);

  return { top, height };
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<AgendaView>("day");
  const [search, setSearch] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("all");
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [prefillSlot, setPrefillSlot] = useState<{ date: string; time: string } | null>(null);

  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals();
  const professionals = (professionalsData?.professionals ?? []).filter((p) => p.active);

  const currentDateYMD = format(currentDate, "yyyy-MM-dd");
  const effectiveProfessionalId =
    selectedProfessionalId === "all" ? undefined : selectedProfessionalId;

  const { data: dailyAgenda, isLoading: dailyLoading } = useAgendaDaily(
    effectiveProfessionalId,
    currentDateYMD
  );

  const { data: weeklyAgenda, isLoading: weeklyLoading } = useAgendaWeekly(
    effectiveProfessionalId,
    currentDateYMD
  );

  const isLoading = professionalsLoading || (view === "day" ? dailyLoading : weeklyLoading);

  const selectedProfessional = useMemo(() => {
    if (selectedProfessionalId === "all") return null;
    return professionals.find((p) => p.id === selectedProfessionalId) ?? null;
  }, [professionals, selectedProfessionalId]);

  const appointments = useMemo(() => {
    const source =
      view === "day"
        ? dailyAgenda?.appointments ?? []
        : weeklyAgenda?.appointments ?? [];

    if (!search.trim()) return source;

    const q = search.toLowerCase();

    return source.filter((appt) => {
      const professionalName = appt.professional?.name?.toLowerCase() ?? "";

      return (
        appt.client.fullName.toLowerCase().includes(q) ||
        appt.service.name.toLowerCase().includes(q) ||
        professionalName.includes(q)
      );
    });
  }, [view, dailyAgenda, weeklyAgenda, search]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const navigate = (direction: -1 | 1) => {
    const step = view === "week" ? 7 : 1;
    setCurrentDate((prev) => addDays(prev, direction * step));
  };

  const handleNewAppointment = () => {
    setPrefillSlot({
      date: format(currentDate, "yyyy-MM-dd"),
      time: "09:00",
    });
    setShowNewAppointmentModal(true);
  };

  const handleSlotClick = (date: Date, time: string, professionalId?: string) => {
    if (selectedProfessionalId === "all" && !professionalId) return;

    setPrefillSlot({
      date: format(date, "yyyy-MM-dd"),
      time,
    });

    if (selectedProfessionalId !== "all" && professionalId) {
      setSelectedProfessionalId(professionalId);
    }

    setShowNewAppointmentModal(true);
  };

  const handleAppointmentClick = (appointment: AgendaAppointment) => {
    console.log("Editar/ver turno", appointment);
  };

  const dayAppointments = appointments.filter((appt) => {
    return format(parseISO(appt.startAt), "yyyy-MM-dd") === currentDateYMD;
  });

  const dailyScheduleBlocksByProfessional =
    dailyAgenda?.scheduleBlocksByProfessional ?? {};

  return (
    <>
      <div className="max-w-full mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Agenda
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>

          <button
            onClick={handleNewAppointment}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo turno
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center xl:justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(-1)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            >
              Hoy
            </button>

            <button
              onClick={() => navigate(1)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              {(["day", "week"] as AgendaView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === v
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {v === "day" ? "Día" : "Semana"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar cliente, servicio o profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-full sm:w-64 text-sm rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={selectedProfessionalId}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
              className="h-9 min-w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos los profesionales</option>
              {professionals.map((p: Professional) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            Cargando agenda...
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
            No hay profesionales cargados.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            {view === "day" ? (
              selectedProfessionalId === "all" ? (
                <div className="overflow-x-auto">
                  <div
                    className="grid min-w-250"
                    style={{
                      gridTemplateColumns: `60px repeat(${professionals.length}, minmax(220px, 1fr))`,
                    }}
                  >
                    <div className="border-b border-r border-slate-200 bg-white sticky top-0 z-10" />

                    {professionals.map((professional) => {
                      const blocks =
                        dailyScheduleBlocksByProfessional[professional.id] ?? [];

                      return (
                        <div
                          key={professional.id}
                          className="border-b border-r border-slate-200 bg-white sticky top-0 z-10 p-3 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  background: professional.color || "#0D9488",
                                }}
                              />
                              <span className="text-sm font-medium text-slate-700">
                                {professional.name}
                              </span>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2">
                              {blocks.map((block) => (
                                <span
                                  key={block.id}
                                  className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-600"
                                >
                                  {block.startTime} - {block.endTime}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {HOURS.map((hour) => (
                      <>
                        <div
                          key={`hour-${hour}`}
                          className="p-2 text-xs text-slate-400 text-right pr-3 border-b border-r border-slate-100 h-16 flex items-start justify-end pt-1"
                        >
                          {String(hour).padStart(2, "0")}:00
                        </div>

                        {professionals.map((professional) => {
                          const hourAppointments = dayAppointments.filter((appt) => {
                            const start = parseISO(appt.startAt);
                            return (
                              appt.professionalId === professional.id &&
                              start.getHours() === hour
                            );
                          });

                          return (
                            <div
                              key={`${professional.id}-${hour}`}
                              className="h-16 relative group cursor-pointer hover:bg-teal-50/20 transition-colors border-b border-r border-slate-50"
                              onClick={() =>
                                handleSlotClick(
                                  currentDate,
                                  `${String(hour).padStart(2, "0")}:00`,
                                  professional.id
                                )
                              }
                            >
                              {hourAppointments.map((appt) => {
                                const { top, height } = getAppointmentTopAndHeight(appt);
                                const color =
                                  appt.professional?.color ||
                                  professional.color ||
                                  "#0D9488";

                                return (
                                  <div
                                    key={appt.id}
                                    className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs z-10 overflow-hidden border-l-[3px] hover:shadow-md transition-shadow cursor-pointer"
                                    style={{
                                      top: `${top}px`,
                                      height: `${height}px`,
                                      borderLeftColor: color,
                                      backgroundColor: `${color}18`,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAppointmentClick(appt);
                                    }}
                                  >
                                    <p className="font-medium text-slate-800 truncate leading-tight">
                                      {appt.client.fullName}
                                    </p>
                                    {height > 32 && (
                                      <p className="text-slate-500 truncate leading-tight">
                                        {appt.service.name}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-175">
                    <div className="grid border-b border-slate-200 sticky top-0 bg-white z-10 grid-cols-[60px_1fr]">
                      <div className="p-2 text-xs text-slate-400 border-r border-slate-100" />
                      <div className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2 flex-col">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex"
                              style={{
                                background: selectedProfessional?.color || "#0D9488",
                              }}
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {selectedProfessional?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {HOURS.map((hour) => {
                      const hourAppointments = dayAppointments.filter((appt) => {
                        const start = parseISO(appt.startAt);
                        return start.getHours() === hour;
                      });

                      return (
                        <div
                          key={hour}
                          className="grid border-b border-slate-50 grid-cols-[60px_1fr]"
                        >
                          <div className="p-2 text-xs text-slate-400 text-right pr-3 border-r border-slate-100 h-16 flex items-start justify-end pt-1">
                            {String(hour).padStart(2, "0")}:00
                          </div>

                          <div
                            className="h-16 relative group cursor-pointer hover:bg-teal-50/20 transition-colors"
                            onClick={() =>
                              handleSlotClick(
                                currentDate,
                                `${String(hour).padStart(2, "0")}:00`
                              )
                            }
                          >
                            {hourAppointments.map((appt) => {
                              const { top, height } = getAppointmentTopAndHeight(appt);
                              const color =
                                selectedProfessional?.color ||
                                appt.professional?.color ||
                                "#0D9488";

                              return (
                                <div
                                  key={appt.id}
                                  className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs z-10 overflow-hidden border-l-[3px] hover:shadow-md transition-shadow cursor-pointer"
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    borderLeftColor: color,
                                    backgroundColor: `${color}18`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppointmentClick(appt);
                                  }}
                                >
                                  <p className="font-medium text-slate-800 truncate leading-tight">
                                    {appt.client.fullName}
                                  </p>
                                  {height > 32 && (
                                    <p className="text-slate-500 truncate leading-tight">
                                      {appt.service.name}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-225">
                  <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <div className="p-2 text-xs text-slate-400 border-r border-slate-100" />
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={`p-3 text-center border-r border-slate-100 last:border-r-0 cursor-pointer hover:bg-slate-50 ${
                          isSameDay(day, new Date()) ? "bg-teal-50" : ""
                        }`}
                        onClick={() => {
                          setCurrentDate(day);
                          setView("day");
                        }}
                      >
                        <p className="text-xs text-slate-400">
                          {format(day, "EEE", { locale: es })}
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            isSameDay(day, new Date())
                              ? "text-teal-600"
                              : "text-slate-700"
                          }`}
                        >
                          {format(day, "d")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-slate-50">
                      <div className="p-2 text-xs text-slate-400 text-right pr-3 border-r border-slate-100 h-14 flex items-start justify-end pt-1">
                        {String(hour).padStart(2, "0")}:00
                      </div>

                      {weekDays.map((day) => {
                        const dayStr = format(day, "yyyy-MM-dd");

                        const hourAppointments = appointments.filter((appt) => {
                          const start = parseISO(appt.startAt);
                          return (
                            format(start, "yyyy-MM-dd") === dayStr &&
                            start.getHours() === hour
                          );
                        });

                        return (
                          <div
                            key={`${dayStr}-${hour}`}
                            className="h-14 border-r border-slate-50 last:border-r-0 relative cursor-pointer hover:bg-teal-50/20"
                            onClick={() =>
                              handleSlotClick(
                                day,
                                `${String(hour).padStart(2, "0")}:00`,
                                selectedProfessionalId === "all" ? undefined : selectedProfessionalId
                              )
                            }
                          >
                            {hourAppointments.map((appt) => {
                              const { top, height } = getAppointmentTopAndHeight(appt);
                              const color =
                                appt.professional?.color ||
                                selectedProfessional?.color ||
                                "#0D9488";

                              return (
                                <div
                                  key={appt.id}
                                  className="absolute inset-x-0.5 top-0.5 rounded px-1 py-0.5 text-[10px] leading-tight overflow-hidden border-l-2 cursor-pointer"
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    borderLeftColor: color,
                                    backgroundColor: `${color}18`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppointmentClick(appt);
                                  }}
                                >
                                  <p className="font-medium text-slate-700 truncate">
                                    {appt.client.fullName}
                                  </p>
                                  {selectedProfessionalId === "all" && (
                                    <p className="truncate text-slate-500">
                                      {appt.professional?.name}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <NewAppointmentModal
        open={showNewAppointmentModal}
        onClose={() => {
          setShowNewAppointmentModal(false);
          setPrefillSlot(null);
        }}
        professionalId={selectedProfessionalId === "all" ? undefined : selectedProfessionalId}
        date={prefillSlot?.date}
        time={prefillSlot?.time}
      />
    </>
  );
}