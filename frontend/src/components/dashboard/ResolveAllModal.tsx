import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import CustomSelect from "../ui/CustomSelect";
import type { AgendaAppointment, PaymentMethod } from "../../types/entities";
import { paymentMethodOptions } from "../../types/entities";

type Props = {
  open: boolean;
  onClose: () => void;
  appointments: AgendaAppointment[];
  onConfirm: (paymentMethod: PaymentMethod) => Promise<void>;
};

export default function ResolveAllModal({
  open,
  onClose,
  appointments,
  onConfirm,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorCount, setErrorCount] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentMethod("");
      setErrorCount(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!paymentMethod || isBusy) return;
    setIsBusy(true);
    setErrorCount(null);
    try {
      await onConfirm(paymentMethod as PaymentMethod);
      setPaymentMethod("");
      onClose();
    } catch (err: unknown) {
      const count = err instanceof Error && err.message ? parseInt(err.message) : null;
      setErrorCount(Number.isFinite(count) ? count : appointments.length);
    } finally {
      setIsBusy(false);
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    setPaymentMethod("");
    setErrorCount(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Resolver todos los pendientes"
      description={`Se marcarán como completados ${appointments.length} turno${appointments.length !== 1 ? "s" : ""} del día seleccionado.`}
      size="sm"
      closeOnBackdrop={!isBusy}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!paymentMethod || isBusy}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Lista de turnos */}
        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
          {appointments.map((appt) => {
            const start = parseISO(appt.startAt);
            const end = parseISO(appt.endAt);
            return (
              <div key={appt.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
                  {format(start, "HH:mm")}–{format(end, "HH:mm")}
                </span>
                <span className="min-w-0 truncate text-sm text-slate-700">
                  {appt.client?.fullName ?? "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selector de método de pago */}
        <CustomSelect
          label="Método de pago"
          placeholder="Seleccionar método..."
          value={paymentMethod}
          onChange={(v) => setPaymentMethod(v as PaymentMethod)}
          options={paymentMethodOptions}
          disabled={isBusy}
        />

        {/* Error parcial */}
        {errorCount !== null && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            {errorCount === appointments.length
              ? "No se pudieron resolver los turnos. Intentá de nuevo."
              : `${errorCount} turno${errorCount !== 1 ? "s" : ""} no pudieron resolverse.`}
          </p>
        )}
      </div>
    </Modal>
  );
}
