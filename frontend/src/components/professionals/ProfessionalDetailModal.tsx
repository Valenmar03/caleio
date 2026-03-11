import { Clock3, User2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useProfessionalServices } from "../../hooks/useProfessionalServices";
import { useProfessionalSchedule } from "../../hooks/useprofessionalSchedule";
import type { Professional } from "../../types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  professional: Professional | null;
};

type ScheduleBlock = {
  id: string;
  businessId: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
};

const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export default function ProfessionalDetailModal({
  open,
  onClose,
  professional,
}: Props) {
  const professionalId = professional?.id;

  const { data: servicesData, isLoading: servicesLoading } =
    useProfessionalServices(professionalId);

  const { data: scheduleData, isLoading: scheduleLoading } =
    useProfessionalSchedule(professionalId);

  const services = servicesData?.services ?? [];
  const scheduleBlocks: ScheduleBlock[] = Object.values(
    scheduleData?.schedules ?? {}
  ).flat();

  const groupedByDay = scheduleBlocks.reduce<Record<number, ScheduleBlock[]>>(
    (acc, block) => {
      if (!acc[block.dayOfWeek]) acc[block.dayOfWeek] = [];
      acc[block.dayOfWeek].push(block);
      return acc;
    },
    {}
  );

  const sortedDays = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={professional ? professional.name : "Profesional"}
      description="Detalle del profesional, servicios asignados y horarios."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={() => {}}>
            Editar profesional
          </Button>
        </div>
      }
    >
      {!professional ? (
        <div className="text-sm text-slate-500">No hay profesional seleccionado.</div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-xl shrink-0"
              style={{ background: professional.color || "#0D9488" }}
            >
              {professional.name?.[0]?.toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {professional.name}
                </h3>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    professional.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {professional.active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User2 className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm font-medium text-slate-800">Servicios</h4>
            </div>

            {servicesLoading ? (
              <p className="text-sm text-slate-500">Cargando servicios...</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-slate-500">Este profesional no tiene servicios asignados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((item: any) => (
                  <span
                    key={item.service.id}
                    className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-medium"
                  >
                    {item.service.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock3 className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm font-medium text-slate-800">Horarios</h4>
            </div>

            {scheduleLoading ? (
              <p className="text-sm text-slate-500">Cargando horarios...</p>
            ) : sortedDays.length === 0 ? (
              <p className="text-sm text-slate-500">Este profesional no tiene horarios cargados.</p>
            ) : (
              <div className="space-y-2">
                {sortedDays.map((day) => {
                  const blocks = groupedByDay[day].sort((a, b) =>
                    a.startTime.localeCompare(b.startTime)
                  );

                  return (
                    <div
                      key={day}
                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-lg bg-white border border-slate-200 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-slate-800 min-w-28">
                        {DAY_LABELS[day]}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {blocks.map((block) => (
                          <span
                            key={block.id}
                            className="text-xs rounded-md bg-slate-100 px-2 py-1 text-slate-600"
                          >
                            {block.startTime} - {block.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}