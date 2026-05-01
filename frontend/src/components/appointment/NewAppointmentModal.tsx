import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import CustomSelect from "../ui/CustomSelect";
import CustomDatePicker from "../ui/CustomDatePicker";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import NewClientFormModal from "../clients/NewClientFormModal";
import { useClients } from "../../hooks/useClients";
import { useProfessionals } from "../../hooks/useProfessionals";
import { useProfessionalServices } from "../../hooks/useProfessionalServices";
import { useAvailability } from "../../hooks/useAvailability";
import { createAppointment } from "../../services/appointments.api";
import type { PaymentMethod } from "../../types/entities";
import { paymentMethodOptions } from "../../types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  professionalId?: string;
  lockProfessional?: boolean;
  date?: string; // yyyy-MM-dd
  time?: string; // HH:mm
};

export default function NewAppointmentModal({
  open,
  onClose,
  professionalId,
  lockProfessional = false,
  date,
  time,
}: Props) {
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedStartAt, setSelectedStartAt] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");

  const [withDeposit, setWithDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<PaymentMethod | "">("");
  const [depositTouched, setDepositTouched] = useState(false);

  const clientBoxRef = useRef<HTMLDivElement | null>(null);

  const { data: clientsData, isLoading: clientsLoading } = useClients(clientSearch);
  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals();

  const {
    data: professionalServicesData,
    isLoading: professionalServicesLoading,
  } = useProfessionalServices(selectedProfessionalId);

  const { data: availabilityData, isLoading: availabilityLoading } = useAvailability(
    selectedProfessionalId,
    selectedDate,
    serviceId
  );

  useEffect(() => {
    if (!open) {
      setClientSearch("");
      setClientId("");
      setClientComboboxOpen(false);
      setSelectedProfessionalId("");
      setServiceId("");
      setSelectedStartAt("");
      setSelectedDate("");
      setWithDeposit(false);
      setDepositAmount("");
      setDepositMethod("");
      setDepositTouched(false);
      return;
    }

    setSelectedProfessionalId(professionalId ?? "");
    setServiceId("");
    setSelectedDate(date ?? format(new Date(), "yyyy-MM-dd"));

    if (date && time && professionalId) {
      const localIso = `${date}T${time}:00:00-03:00`;
      setSelectedStartAt(localIso);
    } else {
      setSelectedStartAt("");
    }
  }, [open, date, time, professionalId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!clientBoxRef.current) return;
      if (!clientBoxRef.current.contains(event.target as Node)) {
        setClientComboboxOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  

  const clients = clientsData?.clients ?? [];
  const professionals = (professionalsData?.professionals ?? []).filter((p) => p.active);
  const professionalServices = professionalServicesData?.services ?? [];
  const slots = availabilityData?.slots ?? [];

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId),
    [clients, clientId]
  );

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => professional.id === selectedProfessionalId),
    [professionals, selectedProfessionalId]
  );

  useEffect(() => {
    if (!serviceId) return;

    const serviceStillExists = professionalServices.some(
      (item) => item.service.id === serviceId
    );

    if (!serviceStillExists) {
      setServiceId("");
      setSelectedStartAt("");
    }
  }, [serviceId, professionalServices]);

  useEffect(() => {
    if (!serviceId) return;

    if (!selectedStartAt && slots.length > 0) {
      setSelectedStartAt(slots[0].startAt);
    }
  }, [serviceId, slots, selectedStartAt]);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedStartAt) return "";
    try {
      return format(parseISO(selectedStartAt), "HH:mm");
    } catch {
      return "";
    }
  }, [selectedStartAt]);

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["availability"] }),
      ]);
      onClose();
    },
  });

  const selectedServicePrice = useMemo(() => {
    if (!serviceId) return null;
    const item = professionalServices.find((i) => i.service.id === serviceId);
    return item ? parseFloat(item.service.basePrice) : null;
  }, [serviceId, professionalServices]);

  const parsedDepositAmount = Number(depositAmount);
  const hasDepositValue = depositAmount.trim() !== "" && !isNaN(parsedDepositAmount);
  const isDepositGreaterThanService =
    hasDepositValue && selectedServicePrice !== null && selectedServicePrice > 0 && parsedDepositAmount > selectedServicePrice;
  const hasValidDepositAmount = hasDepositValue && parsedDepositAmount > 0 && !isDepositGreaterThanService;
  const hasValidDepositMethod = depositMethod.trim() !== "";
  const shouldShowDepositError = withDeposit && depositTouched && !hasValidDepositAmount;
  const shouldShowDepositMethodError = withDeposit && depositTouched && !hasValidDepositMethod;

  const depositValid = !withDeposit || (hasValidDepositAmount && hasValidDepositMethod);

  const canSubmit =
    !!selectedProfessionalId &&
    !!clientId &&
    !!serviceId &&
    !!selectedStartAt &&
    depositValid &&
    !mutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    mutation.mutate({
      professionalId: selectedProfessionalId,
      clientId,
      serviceId,
      startAt: selectedStartAt,
      ...(withDeposit && depositMethod && {
        depositAmount: parsedDepositAmount,
        depositMethod,
      }),
    });
  };

  const handleSelectClient = (client: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
  }) => {
    setClientId(client.id);
    setClientSearch(client.fullName);
    setClientComboboxOpen(false);
  };

  const handleClearClient = () => {
    setClientId("");
    setClientSearch("");
    setClientComboboxOpen(false);
  };

  const handleNewClientCreated = (client: { id: string; fullName: string; phone: string; email?: string | null }) => {
    handleSelectClient({ id: client.id, fullName: client.fullName, phone: client.phone, email: client.email });
  };

  const handleProfessionalChange = (nextProfessionalId: string) => {
    setSelectedProfessionalId(nextProfessionalId);
    setServiceId("");
    setSelectedStartAt("");

    if (!selectedDate || !time) return;

    const localIso = `${selectedDate}T${time}:00:00-03:00`;
    setSelectedStartAt(localIso);
  };

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate);
    setSelectedStartAt("");

    if (!nextDate || !time || !selectedProfessionalId) return;

    const localIso = `${nextDate}T${time}:00:00-03:00`;
    setSelectedStartAt(localIso);
  };

    const professionalOptions = useMemo(
    () =>
      professionals.map((professional) => ({
        value: professional.id,
        label: professional.name,
      })),
    [professionals]
  );

  const serviceOptions = useMemo(
    () =>
      professionalServices.map((item) => ({
        value: item.service.id,
        label: item.service.name,
        description: `${item.service.durationMin} min · $${parseFloat(item.service.basePrice).toLocaleString("es-AR")}`,
      })),
    [professionalServices]
  );

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo turno"
      description="Seleccioná cliente, profesional, servicio y horario disponible."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {mutation.isPending ? "Guardando..." : "Crear turno"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Cliente
            </label>
            <button
              type="button"
              onClick={() => setNewClientModalOpen(true)}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo cliente
            </button>
          </div>

          <div ref={clientBoxRef} className="relative">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientId("");
                  setClientComboboxOpen(true);
                }}
                onFocus={() => setClientComboboxOpen(true)}
                placeholder="Buscar cliente por nombre, teléfono o email"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-20 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />

              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {clientSearch && (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Limpiar cliente"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setClientComboboxOpen((prev) => !prev)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Abrir selector de clientes"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {clientComboboxOpen && (
              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="max-h-72 overflow-y-auto py-1">
                  {clientsLoading ? (
                    <div className="px-3 py-3 text-sm text-slate-500">
                      Cargando clientes...
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-500">
                      No se encontraron clientes.
                    </div>
                  ) : (
                    clients.map((client) => {
                      const isSelected = client.id === clientId;

                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {client.fullName}
                            </div>

                            {(client.phone || client.email) && (
                              <div className="mt-0.5 text-xs text-slate-500">
                                {[client.phone, client.email].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>

                          {isSelected && (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedClient && (
            <p className="mt-1 text-xs text-slate-500">
              Cliente seleccionado:{" "}
              <span className="font-medium text-slate-700">
                {selectedClient.fullName}
              </span>
            </p>
          )}
        </div>

        {lockProfessional ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Profesional
            </label>
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {selectedProfessional?.name ?? "—"}
            </div>
          </div>
        ) : (
          <CustomSelect
            label="Profesional"
            placeholder="Seleccionar profesional"
            value={selectedProfessionalId}
            onChange={handleProfessionalChange}
            options={professionalOptions}
            loading={professionalsLoading}
            loadingText="Cargando profesionales..."
            emptyText="No hay profesionales disponibles."
          />
        )}

        <CustomSelect
          label="Servicio"
          placeholder={
            !selectedProfessionalId
              ? "Seleccionar profesional primero"
              : "Seleccionar servicio"
          }
          value={serviceId}
          onChange={(nextServiceId) => {
            setServiceId(nextServiceId);
            setSelectedStartAt("");
          }}
          options={serviceOptions}
          disabled={!selectedProfessionalId}
          loading={professionalServicesLoading}
          loadingText="Cargando servicios..."
          emptyText="Este profesional no tiene servicios asignados."
          helperText={
            selectedProfessional
              ? `Profesional seleccionado: ${selectedProfessional.name}`
              : undefined
          }
        />

        <CustomDatePicker
          label="Fecha"
          value={selectedDate}
          onChange={handleDateChange}
          color="teal"
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Horarios disponibles
            </label>
            {selectedDate && (
              <span className="text-xs text-slate-500">Fecha: {selectedDate}</span>
            )}
          </div>

          {!selectedProfessionalId ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Elegí un profesional para continuar.
            </div>
          ) : !serviceId ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Elegí un servicio para ver disponibilidad.
            </div>
          ) : availabilityLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Buscando horarios disponibles...
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No hay horarios disponibles para ese día.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const isSelected = selectedStartAt === slot.startAt;

                return (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setSelectedStartAt(slot.startAt)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedSlotLabel && (
          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
            <p className="text-sm text-teal-800">
              Horario seleccionado:{" "}
              <span className="font-semibold">{selectedSlotLabel}</span>
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => {
                setWithDeposit((prev) => {
                  if (prev) {
                    setDepositAmount("");
                    setDepositMethod("");
                    setDepositTouched(false);
                  }
                  return !prev;
                });
              }}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                withDeposit ? "bg-teal-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  withDeposit ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-slate-700">Registrar seña</span>
          </label>

          {withDeposit && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Monto de seña
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  setDepositTouched(true);
                }}
                onBlur={() => setDepositTouched(true)}
                placeholder="Ej: 5000"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${
                  shouldShowDepositError ? "border-red-300" : "border-slate-200"
                }`}
              />
              {shouldShowDepositError && (
                <p className="text-xs text-red-600">
                  {isDepositGreaterThanService
                    ? "La seña no puede ser mayor al valor del servicio."
                    : "Tenés que ingresar una seña válida mayor a 0."}
                </p>
              )}

              <CustomSelect
                label="Método de pago de la seña"
                placeholder="Seleccionar método de pago"
                value={depositMethod}
                onChange={(value) => {
                  setDepositMethod(value as PaymentMethod | "");
                  setDepositTouched(true);
                }}
                options={paymentMethodOptions}
              />

              {shouldShowDepositMethodError && (
                <p className="text-xs text-red-600">
                  Tenés que seleccionar un método de pago para la seña.
                </p>
              )}

              <p className="text-xs text-slate-500">
                Ingresá cuánto abonó el cliente para marcar el turno como señado.
                {selectedServicePrice !== null && selectedServicePrice > 0 && (
                  <>
                    {" "}El valor del servicio es{" "}
                    <span className="font-medium text-slate-700">
                      ${selectedServicePrice.toLocaleString("es-AR")}
                    </span>.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {mutation.isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(mutation.error as Error)?.message || "No se pudo crear el turno."}
          </div>
        )}
      </div>
    </Modal>

    <NewClientFormModal
      open={newClientModalOpen}
      onClose={() => setNewClientModalOpen(false)}
      onSuccess={handleNewClientCreated}
    />
    </>
  );
}