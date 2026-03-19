import type { UseMutationResult } from "@tanstack/react-query";
import Button from "../ui/Button";


type updateMutationType =
    UseMutationResult<unknown, Error, {
    id: string;
    professionalId: string;
    clientId: string;
    serviceId: string;
    startAt: string;
}, unknown>


type Props = {
   canSubmit: boolean;
   showDepositInput: boolean;
   hasValidDepositAmount: boolean;
   isBusy: boolean
   updateMutation: updateMutationType
   handleSubmit: () => void
   onClose: () => void
   showSave: boolean;
   onDelete: () => void;
   deletePending: boolean;
};

export default function FooterDetail({
    canSubmit,
    showDepositInput,
    hasValidDepositAmount,
    isBusy,
    updateMutation,
    handleSubmit,
    onClose,
    showSave,
    onDelete,
    deletePending,
}: Props) {

   return (
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy || deletePending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {deletePending ? "Eliminando..." : "Eliminar turno"}
        </button>

        <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isBusy}>
               Cerrar
            </Button>
            {showSave && (
              <Button
                 onClick={handleSubmit}
                 disabled={!canSubmit}
                 title={
                    showDepositInput && !hasValidDepositAmount
                       ? "Ingresá una seña válida para continuar"
                       : undefined
                 }
              >
                 {updateMutation.isPending
                    ? "Guardando..."
                    : showDepositInput && !hasValidDepositAmount
                      ? "Completá la seña"
                      : "Guardar cambios"}
              </Button>
            )}
         </div>
      </div>
   );
}
